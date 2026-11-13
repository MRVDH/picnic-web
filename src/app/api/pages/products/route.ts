import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CategoryProductsApiResponse } from "@/lib/core/types";
import { mapProductSections } from "@/lib/product/map-product-tile";

/**
 * GET /api/pages/products?pageId=...
 *
 * Fetches a page that lists products by its full page ID (as extracted
 * from a deep-link target), such as theme pages and shop pages, with
 * picnic-api's catalog.getProductPage. Pages Picnic serves as React Server
 * Components come back as `rscPage` instead, for the RSC renderer.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CategoryProductsApiResponse | ApiErrorResponse>> {
  const pageId = request.nextUrl.searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId parameter" }, { status: 400 });
  }

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
    const page = await client.catalog.getProductPage(pageId);
    if (page.format === "rsc") {
      return NextResponse.json({ title: null, products: [], sections: [], rscPage: page.content });
    }
    // Rows without a header render without one; a page without any header lists its products flat.
    const { products, sections } = mapProductSections(page.sections);
    const hasHeaders = sections.some((section) => section.title !== "");

    return NextResponse.json({ title: page.title, products, sections: hasHeaders ? sections : [] });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/pages/products] Failed for pageId="${pageId}":`, message);

    return NextResponse.json(
      { error: "Failed to load products. Please try again later." },
      { status: 502 }
    );
  }
}
