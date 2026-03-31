import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import { parseProductDetailPage } from "@/lib/parse-fusion-product";
import type { ProductDetail, ApiErrorResponse } from "@/lib/types";

/**
 * GET /api/product/[id]
 *
 * Fetches product details by requesting the raw product-details-page-root
 * Fusion page and parsing it server-side. Returns a ProductDetail JSON object.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProductDetail | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 },
    );
  }

  const { id: productId } = await params;

  if (!productId) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 },
    );
  }

  try {
    const client = buildPicnicClient(token);

    const rawPage = await (
      client as unknown as {
        sendRequest: (
          method: string,
          path: string,
          body: null,
          includeFusion: boolean,
        ) => Promise<unknown>;
      }
    ).sendRequest(
      "GET",
      `/pages/product-details-page-root?id=${encodeURIComponent(productId)}`,
      null,
      true,
    );

    const productDetail = parseProductDetailPage(rawPage, productId);

    if (!productDetail.name) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(productDetail);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/product/${productId}] Failed to fetch:`, message);

    return NextResponse.json(
      { error: "Failed to fetch product details. Please try again later." },
      { status: 502 },
    );
  }
}

/** Check if the error indicates an authentication failure from the Picnic API. */
function isApiAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
    );
  }
  return false;
}
