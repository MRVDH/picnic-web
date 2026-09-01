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

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    await client.delivery.cancelDelivery(deliveryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/deliveries/${deliveryId}/cancel] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to cancel delivery. Please try again later." },
      { status: 502 }
    );
  }
}
