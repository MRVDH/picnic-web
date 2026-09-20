import { createHash } from "node:crypto";

import type { PicnicClientInstance } from "@/lib/core/picnic-client";

/**
 * Short-lived cache for Fusion pages that several requests ask for in a row.
 *
 * Building one meal plan fetches a page per candidate recipe and a page per
 * ingredient of every chosen recipe, and a second "generate" repeats most of
 * that: measured over one planning session, a third of all upstream calls
 * asked for a page that had just been fetched. Picnic's edge answers too many
 * requests with a 403 that lasts a minute or two, so those repeats cost the
 * user the feature, not just time.
 *
 * Only catalogue pages belong here. Anything reflecting what the user has done
 * — the cart, delivery slots, every write — must stay uncached.
 */

/**
 * The in-flight request itself is cached, not just its result. Two callers
 * asking for the same page at the same moment — the cookbook grid and the
 * category counts, say — would both miss a cache that only holds finished
 * values, and both would go upstream. Holding the promise lets the second one
 * wait for the first.
 */
type Entry = { promise: Promise<unknown>; expiresAt: number };

const cache = new Map<string, Entry>();

/** Long enough to cover a planning session, short enough to keep prices honest. */
export const PAGE_CACHE_TTL_MS = 10 * 60 * 1000;

/** One session produces a few hundred distinct pages; this keeps a lid on growth. */
const MAX_ENTRIES = 500;

type SendRequestClient = PicnicClientInstance & {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
  countryCode?: string;
};

/**
 * Recipe pages carry member pricing, so two accounts can be shown different
 * numbers for the same recipe. Keying by the token keeps one user's pages out
 * of another's, at no cost when there is only one.
 */
function cacheKey(client: SendRequestClient, path: string): string {
  const token = (client as unknown as { authKey?: string }).authKey ?? "";
  const scope = createHash("sha256").update(token).digest("hex").slice(0, 16);
  return `${client.countryCode ?? ""}:${scope}:${path}`;
}

function evictIfFull(): void {
  if (cache.size < MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  // Still full of live entries: drop the oldest, which Map iterates first.
  while (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

/**
 * Fetch a Fusion page, reusing a recent response for the same path when there
 * is one. Failures are never cached, so a blocked request does not poison the
 * entry for as long as the block lasts.
 */
export async function fetchCachedPage(
  client: PicnicClientInstance,
  path: string,
  ttlMs: number = PAGE_CACHE_TTL_MS
): Promise<unknown> {
  const typed = client as SendRequestClient;
  const key = cacheKey(typed, path);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise;

  const promise = typed.sendRequest("GET", path, null, true);
  evictIfFull();
  cache.set(key, { promise, expiresAt: Date.now() + ttlMs });

  // A rejection must not be served to anyone else, or one blocked request would
  // stand in for this page until the entry expired. Drop it and let the next
  // caller try again.
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });

  return promise;
}
