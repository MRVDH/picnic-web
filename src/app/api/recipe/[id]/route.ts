import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { RecipeDetailApiResponse } from "@/lib/core/types";
import { fetchRecipeDetail } from "@/lib/recipe/fetch-recipe-detail";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RecipeDetailApiResponse | { error: string }>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  if (!RECIPE_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);
    const portionsParam = request.nextUrl.searchParams.get("portions");
    const portions = portionsParam ? parseInt(portionsParam, 10) : undefined;
    const detail = await fetchRecipeDetail(
      client,
      id,
      portions && portions > 0 ? portions : undefined
    );
    return NextResponse.json(detail);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load recipe" }, { status: 502 });
  }
}
