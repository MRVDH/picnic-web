import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import type { CategoriesApiResponse } from "@/lib/category-types";
import { parseCategoryPage } from "@/lib/parse-categories";
import { parseShortcutsPage } from "@/lib/parse-shortcuts";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse } from "@/lib/types";

const SEARCH_EMPTY_PAGE_ID = "empty-search-page-root";
const HOME_PAGE_ID = "home_page_root";

/**
 * GET /api/categories
 *
 * Fetches both the empty-search-page-root (category list) and
 * home_page_root (shortcut tiles) in parallel, then returns
 * the combined parsed result.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CategoriesApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  try {
    const client = buildPicnicClient(token, countryCode);

    const [searchPage, homePage] = await Promise.all([
      client.app.getPage(SEARCH_EMPTY_PAGE_ID),
      client.app.getPage(HOME_PAGE_ID),
    ]);

    const categories = parseCategoryPage(searchPage);
    const shortcuts = parseShortcutsPage(homePage);

    return NextResponse.json({ categories, shortcuts });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/categories] Failed to fetch categories:", message);

    return NextResponse.json(
      { error: "Failed to load categories. Please try again later." },
      { status: 502 }
    );
  }
}
