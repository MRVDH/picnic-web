import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CategoryProductsApiResponse } from "@/lib/core/types";
import { extractPageTitle } from "@/lib/pml/pml-helpers";
import { parseProductPage } from "@/lib/product/parse-product-page";

/**
 * GET /api/pages/products?pageId=...
 *
 * Fetches an arbitrary Picnic page by its full page ID (as extracted
 * from a deep-link target) and returns any products found in the PML
 * tree, such as theme pages and shop pages. Pages Picnic
 * serves as React Server Components come back as `rscPage` instead, for the
 * RSC renderer.
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
    const page = await client.app.getPage(pageId);
    if (page.format === "rsc") {
      return NextResponse.json({ title: null, products: [], sections: [], rscPage: page.content });
    }
    const title = extractPageTitle(page.page);
    const { sections, products } = parseProductPage(page.page);

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
