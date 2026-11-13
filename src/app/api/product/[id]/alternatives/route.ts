import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient, isProductNotFoundError } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CheaperAlternativesResponse } from "@/lib/core/types";

/**
 * GET /api/product/[id]/alternatives
 *
 * The similar products that cost less per kg, litre or piece, from
 * picnic-api's catalog.getCheaperAlternatives. The cart asks for them per line.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CheaperAlternativesResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);
  const { id: productId } = await params;

  try {
    const client = buildPicnicClient(token, countryCode);
    const result = await client.catalog.getCheaperAlternatives(productId);
    return NextResponse.json({
      comparisonPrice: result.comparisonPrice,
      alternatives: result.alternatives.map((alternative) => ({
        id: alternative.id,
        name: alternative.name,
        imageId: alternative.imageId,
        displayPrice: alternative.displayPrice,
        unitQuantity: alternative.unitQuantity,
        maxCount: alternative.maxCount,
        comparisonPrice: alternative.comparisonPrice,
        savingPerUnit: alternative.savingPerUnit,
      })),
    });
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
    console.error(`[/api/product/${productId}/alternatives] Failed to fetch:`, message);

    return NextResponse.json(
      { error: "Failed to fetch alternatives. Please try again later." },
      { status: 502 }
    );
  }
}
