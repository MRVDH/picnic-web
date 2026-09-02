import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ApiErrorResponse } from "@/lib/core/types";
import { buildPicnicClient } from "@/lib/core/picnic-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
): Promise<NextResponse<unknown | ApiErrorResponse>> {
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
    const scenario = await client.delivery.getDeliveryScenario(deliveryId);
    return NextResponse.json(scenario);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/deliveries/${deliveryId}/scenario] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to load delivery scenario. Please try again later." },
      { status: 502 }
    );
  }
}
