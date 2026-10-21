import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CookbookApiResponse } from "@/lib/core/types";
import {
  CATEGORY_KEY_RE,
  SAVED_CATEGORY_ID,
  fetchCategoryRecipes,
  fetchRecipeOverview,
  fetchSavedRecipes,
} from "@/lib/recipe/fetch-recipe-lists";

/**
 * GET /api/cookbook?category=<id>
 *
 * Without a category: the recipes of the cookbook home and its categories. With
 * `__saved__`: the saved recipes. With a category id from that list: its recipes.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CookbookApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);
  const categoryId = request.nextUrl.searchParams.get("category");

  try {
    const client = buildPicnicClient(token, countryCode);

    if (categoryId === SAVED_CATEGORY_ID) {
      const recipes = await fetchSavedRecipes(client);
      return NextResponse.json({ categories: [], recipes });
    }

    if (categoryId) {
      if (!CATEGORY_KEY_RE.test(categoryId)) {
        return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
      }
      const recipes = await fetchCategoryRecipes(client, categoryId);
      return NextResponse.json({ categories: [], recipes });
    }

    return NextResponse.json(await fetchRecipeOverview(client));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cookbook] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load recipes. Please try again later." },
      { status: 502 }
    );
  }
}
