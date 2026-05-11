import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseCookbookPage } from "@/lib/parse-cookbook";
import { buildPicnicClient } from "@/lib/picnic-client";
import { getRecipeCategories } from "@/lib/recipe-categories";
import type { PicnicClientInstance } from "@/lib/picnic-client";

// Server-side cache per country, expires after 5 minutes.
const cache = new Map<string, { counts: Record<string, number>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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
  const cacheKey = `${countryCode}:${token.slice(-8)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.counts);
  }

  try {
    const client = buildPicnicClient(token, countryCode);
    const categories = getRecipeCategories(countryCode);

    const [featuredCount, ...categoryEntries] = await Promise.all([
      fetchCount(client, "meals-page-root"),
      ...categories.map(async (cat) => [cat.id, await fetchCount(client, cat.id)] as const),
    ]);

    const counts = { __featured__: featuredCount, ...Object.fromEntries(categoryEntries) };
    cache.set(cacheKey, { counts, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(counts);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load counts" }, { status: 502 });
  }
}
