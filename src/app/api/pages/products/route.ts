import { NextRequest, NextResponse } from "next/server";

import { extractPageTitle } from "@/lib/category/parse-subcategories";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient, isUnexpectedPageFormatError } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CategoryProductsApiResponse } from "@/lib/core/types";
import { parseRscPage } from "@/lib/rsc/parse-rsc-page";
import { parseCategoryPageSections } from "@/lib/search/parse-fusion-search";

/**
 * GET /api/pages/products?pageId=...
 *
 * Fetches an arbitrary Picnic page by its full page ID (as extracted
 * from a deep-link target) and returns any products found in the PML
 * tree. Works for promotional pages, campaign pages, and category
 * pages alike. Pages Picnic serves as React Server Components come back as
 * `rscPage` instead, for the RSC renderer.
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
    let rawPage;
    try {
      rawPage = await client.app.getPage(pageId);
    } catch (error) {
      if (!isUnexpectedPageFormatError(error)) throw error;
      const rscPage = parseRscPage(pageId, await client.app.getRscPage(pageId));
      return NextResponse.json({ title: null, products: [], sections: [], rscPage });
    }
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
    console.error(`[/api/pages/products] Failed for pageId="${pageId}":`, message);

    return NextResponse.json(
      { error: "Failed to load products. Please try again later." },
      { status: 502 }
    );
  }
}
