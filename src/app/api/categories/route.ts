import { NextRequest, NextResponse } from "next/server";

import type { CategoriesApiResponse } from "@/lib/category/category-types";
import { parseCategoriesTitle, parseCategoryPage } from "@/lib/category/parse-categories";
import { parseShortcutsPage } from "@/lib/category/parse-shortcuts";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

/** The page the Picnic app shows on its search tab before anything is typed. */
const CATEGORY_TREE_PAGE_ID = "category-tree-root";

/**
 * GET /api/categories
 *
 * Fetches category-tree-root, the same page the app's search tab renders,
 * and returns its shortcut rows, categories heading and categories.
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
    const page = await client.app.getPage(CATEGORY_TREE_PAGE_ID);

    return NextResponse.json({
      categories: parseCategoryPage(page),
      categoriesTitle: parseCategoriesTitle(page),
      shortcuts: parseShortcutsPage(page),
    });
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
