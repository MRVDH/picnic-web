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

type ScopedClient = PicnicClientInstance & { countryCode?: string; authKey?: string | null };

/**
 * Recipe pages carry member pricing, so two accounts can be shown different
 * numbers for the same recipe. Keying by the token keeps one user's pages out
 * of another's, at no cost when there is only one.
 */
export function scopedCacheKey(client: PicnicClientInstance, path: string): string {
  const scoped = client as ScopedClient;
  const token = scoped.authKey ?? "";
  const scope = createHash("sha256").update(token).digest("hex").slice(0, 16);
  return `${scoped.countryCode ?? ""}:${scope}:${path}`;
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
 * Run a picnic-api call that reads catalogue data, reusing a recent result for
 * the same `name` (e.g. "recipe:<id>:<portions>"). Failures are never cached, so a blocked
 * request does not poison the entry for as long as the block lasts.
 */
export function cachedCall<T>(
  client: PicnicClientInstance,
  name: string,
  call: () => Promise<T>,
  ttlMs: number = PAGE_CACHE_TTL_MS
): Promise<T> {
  const key = scopedCacheKey(client, name);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise as Promise<T>;

  const promise = call();
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
