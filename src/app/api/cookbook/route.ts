import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseCookbookPage, parseRecipeCategories } from "@/lib/parse-cookbook";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse, CookbookApiResponse } from "@/lib/types";

const CATEGORY_ID_RE = /^recipe-cattree-[\w-]+$/;

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

    if (categoryId) {
      if (!CATEGORY_ID_RE.test(categoryId)) {
        return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
      }
      const rawPage = await client.app.getPage(categoryId);
      const recipes = parseCookbookPage(rawPage);
      return NextResponse.json({ categories: [], recipes });
    }

    // No category — return homepage recipes + all categories
    const rawPage = await client.recipe.getRecipesPage();
    const recipes = parseCookbookPage(rawPage);
    const categories = parseRecipeCategories(rawPage);
    return NextResponse.json({ categories, recipes });
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
