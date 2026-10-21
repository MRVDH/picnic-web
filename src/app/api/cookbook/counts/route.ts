import { NextRequest, NextResponse } from "next/server";

import crypto from "node:crypto";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { mapWithConcurrency } from "@/lib/core/concurrency";
import { RECIPE_PAGE_CONCURRENCY } from "@/lib/core/constants";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type { RecipeItem } from "@/lib/core/types";
import {
  SAVED_CATEGORY_ID,
  fetchCategoryRecipes,
  fetchRecipeOverview,
  fetchSavedRecipes,
} from "@/lib/recipe/fetch-recipe-lists";

// Server-side cache per country, expires after an hour.
const cache = new Map<string, { counts: Record<string, number>; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function count(name: string, recipes: () => Promise<RecipeItem[]>): Promise<number> {
  try {
    return (await recipes()).length;
  } catch (err) {
    console.error(`[cookbook/counts] Failed to fetch count for "${name}":`, err);
    return 0;
  }
}

async function fetchCounts(client: PicnicClientInstance): Promise<Record<string, number>> {
  const overview = await fetchRecipeOverview(client);
  // The lists run RECIPE_PAGE_CONCURRENCY at a time; a group fetches its categories one by one
  // within that, so this never runs more requests at once.
  const [savedCount, ...categoryCounts] = await mapWithConcurrency(
    [SAVED_CATEGORY_ID, ...overview.categories.map((category) => category.id)],
    (id) =>
      count(id, () =>
        id === SAVED_CATEGORY_ID ? fetchSavedRecipes(client) : fetchCategoryRecipes(client, id, 1)
      ),
    RECIPE_PAGE_CONCURRENCY
  );
  return {
    __featured__: overview.recipes.length,
    [SAVED_CATEGORY_ID]: savedCount,
    ...Object.fromEntries(
      overview.categories.map((category, i) => [category.id, categoryCounts[i]])
    ),
  };
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
    const counts = await fetchCounts(buildPicnicClient(token, countryCode));
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    if (total > 0) {
      cache.set(cacheKey, { counts, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return NextResponse.json(counts);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load counts" }, { status: 502 });
  }
}
