import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, SearchApiResponse } from "@/lib/core/types";
import { mapSearchSections } from "@/lib/product/map-product-tile";

/**
 * GET /api/search?q=<query>
 *
 * Searches the Picnic catalog the way the app does (picnic-api's
 * catalog.getSearchResults) and returns the products and the sections
 * ("Opnieuw bestellen", "Halfvol", ...).
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ products: [], sections: [], query: "" });
  }

  try {
    const client = buildPicnicClient(token, countryCode);

    const results = await client.catalog.getSearchResults(query);
    const { products, sections } = mapSearchSections(results.products);

    return NextResponse.json({ products, sections, query });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/search] Failed to search:", message);

    return NextResponse.json(
      { error: "Failed to search for products. Please try again later." },
      { status: 502 }
    );
  }
}
