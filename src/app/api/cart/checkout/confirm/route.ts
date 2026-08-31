import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: true; orderId: string } | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  let orderId: string;
  let transactionId: string | null = null;
  try {
    const body = (await request.json()) as { orderId?: unknown; transactionId?: unknown };
    if (typeof body.orderId !== "string" || !body.orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    orderId = body.orderId;
    if (typeof body.transactionId === "string" && body.transactionId) {
      transactionId = body.transactionId;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));

    if (transactionId) {
      const status = await client.cart.getCheckoutStatus(transactionId);
      if (status.checkout_status !== "FINISHED") {
        return NextResponse.json(
          { error: "Payment not completed yet. Cannot confirm order." },
          { status: 409 }
        );
      }
    }

    const confirmation = await client.cart.confirmOrder(orderId);
    return NextResponse.json({ success: true, orderId: confirmation.order_id });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/checkout/confirm] Failed:", message);

    return NextResponse.json(
      { error: "Failed to confirm order. Please try again later." },
      { status: 502 }
    );
  }
}
