import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { MEAL_PLAN_MAX_CANDIDATES } from "@/lib/core/constants";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type {
  ApiErrorResponse,
  MealPlanSearchRequest,
  MealPlanSearchResponse,
  RecipeDetail,
} from "@/lib/core/types";
import { findBestCombinations } from "@/lib/meal-plan/find-combinations";
import { fetchRecipePage } from "@/lib/recipe/fetch-recipe-detail";
import { parseRecipeDetail } from "@/lib/recipe/parse-recipe-detail";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;
const TOP_K = 5;

/** Lightweight fetch for the search phase: raw page + parse only, no per-ingredient
 *  enrichment — scoring only needs quantities/condiment flags/stub prices. */
async function fetchLightweight(
  client: PicnicClientInstance,
  id: string,
  portions: number
): Promise<RecipeDetail | null> {
  try {
    const rawPage = await fetchRecipePage(client, id, portions);
    return parseRecipeDetail(rawPage, id);
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<MealPlanSearchResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  let body: MealPlanSearchRequest;
  try {
    body = (await request.json()) as MealPlanSearchRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const candidateIds = Array.isArray(body.candidateIds)
    ? body.candidateIds.filter((id) => RECIPE_ID_RE.test(id)).slice(0, MEAL_PLAN_MAX_CANDIDATES)
    : [];
  const fixedIds = Array.isArray(body.fixedIds)
    ? body.fixedIds.filter((id) => RECIPE_ID_RE.test(id))
    : [];
  const slots = Number.isInteger(body.slots) ? body.slots : 0;
  const people = Number.isInteger(body.people) ? body.people : 0;

  if (slots < 1) {
    return NextResponse.json({ error: "slots must be at least 1" }, { status: 400 });
  }
  if (people < 1 || people > 12) {
    return NextResponse.json({ error: "people must be between 1 and 12" }, { status: 400 });
  }

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);

    const [candidateResults, fixedResults] = await Promise.all([
      Promise.all(candidateIds.map((id) => fetchLightweight(client, id, people))),
      Promise.all(fixedIds.map((id) => fetchLightweight(client, id, people))),
    ]);

    const candidates = candidateResults.filter((r): r is RecipeDetail => r !== null);
    const fixed = fixedResults.filter((r): r is RecipeDetail => r !== null);

    const effectiveSlots = Math.min(slots, candidates.length);
    if (effectiveSlots < 1) {
      return NextResponse.json({ combinations: [] });
    }

    const combinations = findBestCombinations(candidates, effectiveSlots, fixed, TOP_K);
    return NextResponse.json({ combinations });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/meal-plan/search] Failed:", message);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 502 });
  }
}
