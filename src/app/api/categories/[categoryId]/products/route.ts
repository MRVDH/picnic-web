import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseCategoryPageSections } from "@/lib/parse-fusion-search";
import { extractPageTitle } from "@/lib/parse-subcategories";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse, CategoryProductsApiResponse } from "@/lib/types";

const L2_PAGE_PREFIX = "L2-category-page-root?category_id=";

/**
 * GET /api/categories/[categoryId]/products
 *
 * Fetches the L2 category page for the given sub-category ID
 * and returns its products parsed from the PML selling-unit tiles.
 * Sections are extracted when the PML tree contains section headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse<CategoryProductsApiResponse | ApiErrorResponse>> {
  const { categoryId } = await params;
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
    const rawPage = await client.app.getPage(`${L2_PAGE_PREFIX}${categoryId}`);
    const title = extractPageTitle(rawPage);
    const { sections, products } = parseCategoryPageSections(rawPage);

    return NextResponse.json({ title, products, sections });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/categories/${categoryId}/products] Failed:`, message);

    return NextResponse.json(
      {
        error: "Kan producten niet laden. Probeer het later opnieuw.",
      },
      { status: 502 }
    );
  }
}
