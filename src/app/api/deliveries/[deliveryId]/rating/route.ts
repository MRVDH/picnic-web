import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ApiErrorResponse } from "@/lib/core/types";
import { buildPicnicClient } from "@/lib/core/picnic-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
): Promise<NextResponse<{ success: true } | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const { deliveryId } = await params;

  if (!deliveryId) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  let rating: number;
  try {
    const body = (await request.json()) as { rating?: unknown };
    if (typeof body.rating !== "number" || body.rating < 0 || body.rating > 10) {
      return NextResponse.json({ error: "Rating must be a number between 0 and 10" }, { status: 400 });
    }
    rating = body.rating;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    await client.delivery.setDeliveryRating(deliveryId, rating);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    const alreadyRated =
      message.includes("400") || message.toLowerCase().includes("already");

    if (alreadyRated) {
      return NextResponse.json({ error: "Delivery already rated" }, { status: 400 });
    }

    console.error(`[/api/deliveries/${deliveryId}/rating] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to submit rating. Please try again later." },
      { status: 502 }
    );
  }
}
