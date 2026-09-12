import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type {
  ApiErrorResponse,
  MealPlanShoppingListRequest,
  MealPlanShoppingListResponse,
  RecipeDetail,
} from "@/lib/core/types";
import { consolidateForDisplay } from "@/lib/meal-plan/consolidate-ingredients";
import { fetchRecipeDetail } from "@/lib/recipe/fetch-recipe-detail";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;
// Matches the cookbook page's day-count input cap (min={1} max={30}).
const MAX_RECIPES = 30;

export async function POST(
  request: NextRequest
): Promise<NextResponse<MealPlanShoppingListResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const typedBody = body as MealPlanShoppingListRequest;
  const recipeIds = Array.isArray(typedBody.recipeIds)
    ? typedBody.recipeIds.filter((id) => RECIPE_ID_RE.test(id)).slice(0, MAX_RECIPES)
    : [];
  const people = Number.isInteger(typedBody.people) ? typedBody.people : 0;

  if (recipeIds.length === 0) {
    return NextResponse.json({ error: "recipeIds must not be empty" }, { status: 400 });
  }
  if (people < 1 || people > 12) {
    return NextResponse.json({ error: "people must be between 1 and 12" }, { status: 400 });
  }

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);

    const results = await Promise.allSettled(
      recipeIds.map((id) => fetchRecipeDetail(client, id, people))
    );
    const recipes: RecipeDetail[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") recipes.push(result.value);
    }

    if (recipes.length === 0) {
      // Same reasoning as the search route: an expired token rejects every
      // recipe, and that must surface as TOKEN_EXPIRED, not a generic 502.
      const authFailed = results.some(
        (result) => result.status === "rejected" && isApiAuthError(result.reason)
      );
      if (authFailed) {
        return NextResponse.json(
          { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: "Failed to load any recipe in the plan" }, { status: 502 });
    }

    const { items, packagesSaved, totalPriceCents } = consolidateForDisplay(recipes);

    return NextResponse.json({
      recipes: recipes.map((r) => ({ id: r.id, name: r.name, imageId: r.imageId })),
      items,
      totalPriceCents,
      packagesSaved,
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/meal-plan/shopping-list] Failed:", message);
    return NextResponse.json({ error: "Failed to build shopping list" }, { status: 502 });
  }
}
