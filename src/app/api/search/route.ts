import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseFusionSearchSections } from "@/lib/parse-fusion-search";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse, SearchApiResponse } from "@/lib/types";

/**
 * GET /api/search?q=<query>
 *
 * Searches the Picnic catalog and returns transformed Product[].
 * Uses the raw Fusion page response to extract full product metadata
 * (promotions, size labels, Bio prefix, unavailability) from the PML structure.
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

    // Fetch the raw Fusion page to access the full PML structure.
    // The picnic-api catalog.search() method loses PML-embedded metadata
    // because it only extracts $..sellingUnit via JSONPath.
    const rawPage = await (
      client as unknown as {
        sendRequest: (
          method: string,
          path: string,
          body: null,
          includeFusion: boolean
        ) => Promise<unknown>;
      }
    ).sendRequest(
      "GET",
      `/pages/search-page-results?search_term=${encodeURIComponent(query)}`,
      null,
      true
    );

    const { products, sections } = parseFusionSearchSections(rawPage);

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
