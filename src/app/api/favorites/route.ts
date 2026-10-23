import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, FavoritesApiResponse } from "@/lib/core/types";
import { mapFavoritesAisles } from "@/lib/product/map-product-tile";

/**
 * GET /api/favorites
 *
 * The products the customer buys, per aisle, as the app's "Favorieten" tab
 * shows them (picnic-api's catalog.getFavorites). Aisles with `complete: false`
 * show part of their products; /api/favorites/<aisleId> returns all of them.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<FavoritesApiResponse | ApiErrorResponse>> {
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
    const favorites = await client.catalog.getFavorites();

    return NextResponse.json({ aisles: mapFavoritesAisles(favorites) });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/favorites] Failed to load favorites:", message);

    return NextResponse.json(
      { error: "Failed to load favorites. Please try again later." },
      { status: 502 }
    );
  }
}
