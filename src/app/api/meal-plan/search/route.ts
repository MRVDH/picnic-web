import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError, isUpstreamBlockError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { mapWithConcurrency } from "@/lib/core/concurrency";
import { MEAL_PLAN_MAX_CANDIDATES, RECIPE_PAGE_CONCURRENCY } from "@/lib/core/constants";
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
  } catch (error) {
    // An expired token, or a block from the edge, fails every candidate
    // identically — let either reach the outer handler so the client is told
    // what happened, instead of showing a silently empty plan. Other per-recipe
    // failures are tolerated.
    if (isApiAuthError(error) || isUpstreamBlockError(error)) throw error;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const typedBody = body as MealPlanSearchRequest;
  const candidateIds = Array.isArray(typedBody.candidateIds)
    ? typedBody.candidateIds
        .filter((id) => RECIPE_ID_RE.test(id))
        .slice(0, MEAL_PLAN_MAX_CANDIDATES)
    : [];
  const fixedIds = Array.isArray(typedBody.fixedIds)
    ? typedBody.fixedIds.filter((id) => RECIPE_ID_RE.test(id))
    : [];
  const slots = Number.isInteger(typedBody.slots) ? typedBody.slots : 0;
  const people = Number.isInteger(typedBody.people) ? typedBody.people : 0;

  if (slots < 1) {
    return NextResponse.json({ error: "slots must be at least 1" }, { status: 400 });
  }
  if (people < 1 || people > 12) {
    return NextResponse.json({ error: "people must be between 1 and 12" }, { status: 400 });
  }

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);

    const candidateResults = await mapWithConcurrency(
      candidateIds,
      (id) => fetchLightweight(client, id, people),
      RECIPE_PAGE_CONCURRENCY
    );
    const fixedResults = await mapWithConcurrency(
      fixedIds,
      (id) => fetchLightweight(client, id, people),
      RECIPE_PAGE_CONCURRENCY
    );

    const candidates = candidateResults.filter((r): r is RecipeDetail => r !== null);
    const fixed = fixedResults.filter((r): r is RecipeDetail => r !== null);

    const effectiveSlots = Math.min(slots, candidates.length);
    if (effectiveSlots < 1) {
      return NextResponse.json({ combinations: [] });
    }

    const combinations = findBestCombinations(candidates, effectiveSlots, fixed, TOP_K);
    return NextResponse.json({ combinations });
  } catch (error) {
    if (isUpstreamBlockError(error)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment.", code: "RATE_LIMITED" as const },
        { status: 503 }
      );
    }
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
