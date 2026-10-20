import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CookbookApiResponse, RecipeItem } from "@/lib/core/types";

/** The cooking time tag on a recipe tile, e.g. "15 min". */
const COOKING_TIME_PATTERN = /^(\d+)\s*min/;

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

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ categories: [], recipes: [] });
  }

  const countryCode = readCountryCode(request);

  try {
    const client = buildPicnicClient(token, countryCode);
    const results = await client.catalog.getSearchResults(q, { context: "MEALS" });
    const recipes: RecipeItem[] = results.recipes.map((recipe) => {
      const minutes = recipe.tags.map((tag) => COOKING_TIME_PATTERN.exec(tag)?.[1]).find(Boolean);
      return {
        id: recipe.id,
        name: recipe.name,
        imageId: recipe.imageId,
        cookingTimeMinutes: minutes ? Number(minutes) : null,
      };
    });
    return NextResponse.json({ categories: [], recipes });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cookbook/search] Failed:", message);
    return NextResponse.json(
      { error: "Failed to search recipes. Please try again later." },
      { status: 502 }
    );
  }
}
