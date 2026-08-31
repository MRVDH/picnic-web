import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { CheckoutPaymentApiResponse } from "@/lib/core/checkout-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<CheckoutPaymentApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  let orderId: string;
  try {
    const body = (await request.json()) as { orderId?: unknown };
    if (typeof body.orderId !== "string" || !body.orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    orderId = body.orderId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const returnUrl = `${origin}/checkout/return`;

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const raw = await client.cart.initiatePayment(orderId, returnUrl);

    const redirectUrl = raw.action?.redirect_url ?? raw.issuer_authentication_url ?? "";
    if (!redirectUrl) {
      return NextResponse.json({ error: "Payment redirect URL missing from Picnic response" }, { status: 502 });
    }

    return NextResponse.json({
      paymentId: raw.payment_id,
      transactionId: raw.transaction_id,
      redirectUrl,
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/checkout/initiate] Failed:", message);

    return NextResponse.json(
      { error: "Failed to initiate payment. Please try again later." },
      { status: 502 }
    );
  }
}
