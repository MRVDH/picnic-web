import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, PromotionsApiResponse } from "@/lib/core/types";
import { mapPromotionsSections } from "@/lib/product/map-product-tile";

/**
 * GET /api/promotions
 *
 * The promotions page (picnic-api's catalog.getPromotions): its sections with
 * products and cards for promotions on several products.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<PromotionsApiResponse | ApiErrorResponse>> {
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
    const promotions = await client.catalog.getPromotions();

    return NextResponse.json({ sections: mapPromotionsSections(promotions) });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/promotions] Failed to load promotions:", message);

    return NextResponse.json(
      { error: "Failed to load promotions. Please try again later." },
      { status: 502 }
    );
  }
}
