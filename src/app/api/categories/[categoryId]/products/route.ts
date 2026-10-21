import { NextRequest, NextResponse } from "next/server";

import { PROMOTIONS_PREFIX } from "@/lib/category/map-categories";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CategoryProductsApiResponse } from "@/lib/core/types";
import { mapSearchSections } from "@/lib/product/map-product-tile";

/**
 * GET /api/categories/[categoryId]/products
 *
 * Returns the products of a subcategory in sections, from picnic-api's
 * catalog.getCategoryProducts. For `promotions-<categoryId>` it returns the
 * promotions of that category (catalog.getCategoryPromotions).
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
    const page = categoryId.startsWith(PROMOTIONS_PREFIX)
      ? await client.catalog.getCategoryPromotions(categoryId.slice(PROMOTIONS_PREFIX.length))
      : await client.catalog.getCategoryProducts(categoryId);
    const { sections, products } = mapSearchSections(page.results);

    return NextResponse.json({ title: page.title || null, products, sections });
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
        error: "Failed to load products. Please try again later.",
      },
      { status: 502 }
    );
  }
}
