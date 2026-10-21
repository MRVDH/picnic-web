import { NextRequest, NextResponse } from "next/server";

import type PicnicClient from "picnic-api";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

type DeliveryPosition = PicnicClient.Types.delivery.DeliveryPosition;

/**
 * GET /api/deliveries/[deliveryId]/position
 *
 * A delivery's position from picnic-api: whether it is in progress, the arrival estimate and
 * the route version.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
): Promise<NextResponse<DeliveryPosition | ApiErrorResponse>> {
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

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const position = await client.delivery.getDeliveryPosition(deliveryId);
    return NextResponse.json(position);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/deliveries/${deliveryId}/position] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to load delivery position. Please try again later." },
      { status: 502 }
    );
  }
}
