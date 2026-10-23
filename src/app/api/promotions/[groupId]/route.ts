import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, PromotionGroupApiResponse } from "@/lib/core/types";
import { mapProductTiles } from "@/lib/product/map-product-tile";

/**
 * GET /api/promotions/<groupId>
 *
 * The products of one promotion group (picnic-api's catalog.getPromotionGroup),
 * e.g. all "1+1 gratis" Johma salads.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse<PromotionGroupApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);
  const { groupId } = await params;

  try {
    const client = buildPicnicClient(token, countryCode);
    const group = await client.catalog.getPromotionGroup(groupId);

    return NextResponse.json({ name: group.name, products: mapProductTiles(group.products) });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/promotions/${groupId}] Failed to load the promotion group:`, message);

    return NextResponse.json(
      { error: "Failed to load the promotion. Please try again later." },
      { status: 502 }
    );
  }
}
