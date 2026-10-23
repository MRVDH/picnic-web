import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, FavoritesAisleApiResponse } from "@/lib/core/types";
import { mapProductTiles } from "@/lib/product/map-product-tile";

/**
 * GET /api/favorites/<aisleId>
 *
 * All products the customer buys in one aisle (picnic-api's
 * catalog.getFavoritesInAisle), for aisles the favorites page shows in part.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ aisleId: string }> }
): Promise<NextResponse<FavoritesAisleApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);
  const { aisleId } = await params;

  try {
    const client = buildPicnicClient(token, countryCode);
    const tiles = await client.catalog.getFavoritesInAisle(aisleId);

    return NextResponse.json({ products: mapProductTiles(tiles) });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/favorites/${aisleId}] Failed to load the aisle:`, message);

    return NextResponse.json(
      { error: "Failed to load favorites. Please try again later." },
      { status: 502 }
    );
  }
}
