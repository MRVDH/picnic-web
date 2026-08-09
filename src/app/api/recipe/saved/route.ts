import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { fetchSavedRecipes } from "@/lib/recipe/fetch-saved-recipes";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, SavedRecipesApiResponse } from "@/lib/core/types";

/**
 * Saved recipe IDs for the logged-in user.
 *
 * The static `saved` segment resolves ahead of the sibling `[id]` route; recipe
 * IDs are 24-char hex, so the two can never collide.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SavedRecipesApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const recipes = await fetchSavedRecipes(client);
    return NextResponse.json({ recipeIds: recipes.map((recipe) => recipe.id) });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/recipe/saved] Failed:", message);

    return NextResponse.json({ error: "Failed to load saved recipes." }, { status: 502 });
  }
}
