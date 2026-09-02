import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { DeliveryDetailApiResponse } from "@/lib/core/delivery-types";
import { parseDeliveryDetail } from "@/lib/delivery/parse-delivery-detail";
import { buildPicnicClient } from "@/lib/core/picnic-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
): Promise<NextResponse<DeliveryDetailApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);
  const { deliveryId } = await params;

  if (!deliveryId) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  try {
    const client = buildPicnicClient(token, countryCode);
    const rawDelivery = await client.delivery.getDelivery(deliveryId);
    const delivery = parseDeliveryDetail(rawDelivery, countryCode);

    if (!delivery.id) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    return NextResponse.json(delivery);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/deliveries/${deliveryId}] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to load delivery. Please try again later." },
      { status: 502 }
    );
  }
}
