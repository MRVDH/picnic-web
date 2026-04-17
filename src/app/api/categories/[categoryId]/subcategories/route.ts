import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import {
  parseSubcategoryPage,
  extractPageTitle,
} from "@/lib/parse-subcategories";
import { isApiAuthError } from "@/lib/api-error";
import type { SubcategoriesApiResponse } from "@/lib/category-types";
import type { ApiErrorResponse } from "@/lib/types";

const L1_PAGE_PREFIX = "L1-category-page-root?category_id=";

/**
 * GET /api/categories/[categoryId]/subcategories
 *
 * Fetches the L1 category page for the given parent category ID
 * and returns its sub-categories parsed from the PML tree.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
): Promise<NextResponse<SubcategoriesApiResponse | ApiErrorResponse>> {
  const { categoryId } = await params;
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 },
    );
  }

  try {
    const client = buildPicnicClient(token);
    const rawPage = await client.app.getPage(
      `${L1_PAGE_PREFIX}${categoryId}`,
    );
    const title = extractPageTitle(rawPage) ?? categoryId;
    const subcategories = parseSubcategoryPage(rawPage);

    return NextResponse.json({ title, subcategories });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(
      `[/api/categories/${categoryId}/subcategories] Failed:`,
      message,
    );

    return NextResponse.json(
      {
        error:
          "Kan subcategorieën niet laden. Probeer het later opnieuw.",
      },
      { status: 502 },
    );
  }
}
