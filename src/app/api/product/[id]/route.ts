import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient, isProductNotFoundError } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, ProductDetail } from "@/lib/core/types";
import { mapProductDetails } from "@/lib/product/map-product-details";

/**
 * GET /api/product/[id]
 *
 * Fetches product details with picnic-api's catalog.getProduct and
 * returns them as a ProductDetail JSON object.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProductDetail | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  const { id: productId } = await params;

  if (!productId) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const client = buildPicnicClient(token, countryCode);
    const product = await client.catalog.getProduct(productId);
    return NextResponse.json(mapProductDetails(product));
  } catch (error) {
    if (isProductNotFoundError(error)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/product/${productId}] Failed to fetch:`, message);

    return NextResponse.json(
      { error: "Failed to fetch product details. Please try again later." },
      { status: 502 }
    );
  }
}
