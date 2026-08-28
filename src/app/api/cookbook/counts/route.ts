import { NextRequest, NextResponse } from "next/server";

import crypto from "node:crypto";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import { parseCookbookPage } from "@/lib/recipe/parse-cookbook";
import { getRecipeCategories } from "@/lib/recipe/recipe-categories";

// Server-side cache per country, expires after an hour.
const cache = new Map<string, { counts: Record<string, number>; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchCount(client: PicnicClientInstance, categoryId: string): Promise<number> {
  try {
    const rawPage = await client.app.getPage(categoryId);
    return parseCookbookPage(rawPage).length;
  } catch {
    return 0;
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<Record<string, number> | { error: string }>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const countryCode = readCountryCode(request);
  const cacheKey = `${countryCode}:${crypto.createHash("sha256").update(token).digest("hex").slice(0, 16)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.counts);
  }

  try {
    const client = buildPicnicClient(token, countryCode);
    const categories = getRecipeCategories(countryCode);

    const [featuredCount, savedCount, ...categoryEntries] = await Promise.all([
      fetchCount(client, "meals-page-root"),
      fetchCount(client, "saved-deep-dive-page-content"),
      ...categories.map(async (cat) => [cat.id, await fetchCount(client, cat.id)] as const),
    ]);

    const counts = {
      __featured__: featuredCount,
      __saved__: savedCount,
      ...Object.fromEntries(categoryEntries),
    };
    cache.set(cacheKey, { counts, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(counts);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load counts" }, { status: 502 });
  }
}
