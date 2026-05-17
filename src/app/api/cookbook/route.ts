import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseCookbookPage } from "@/lib/parse-cookbook";
import { buildPicnicClient } from "@/lib/picnic-client";
import { getRecipeCategories } from "@/lib/recipe-categories";
import type { ApiErrorResponse, CookbookApiResponse } from "@/lib/types";

const CATEGORY_ID_RE = /^recipe-cattree-[\w-]+$/;
const SAVED_PAGE_ID = "saved-deep-dive-page-content";

type SendRequestClient = {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

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

    if (categoryId === "__saved__") {
      const rawPage = await (client as unknown as SendRequestClient).sendRequest(
        "GET",
        `/pages/${SAVED_PAGE_ID}`,
        null,
        true
      );
      const recipes = parseCookbookPage(rawPage);
      return NextResponse.json({ categories: [], recipes });
    }

    if (categoryId) {
      if (!CATEGORY_ID_RE.test(categoryId)) {
        return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
      }
      const rawPage = await client.app.getPage(categoryId);
      const recipes = parseCookbookPage(rawPage);
      return NextResponse.json({ categories: [], recipes });
    }

    // Default: editorial homepage + full hardcoded category list
    const rawPage = await client.recipe.getRecipesPage();
    const recipes = parseCookbookPage(rawPage);
    const categories = getRecipeCategories(countryCode);
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
