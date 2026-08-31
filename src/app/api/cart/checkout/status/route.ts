import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { CheckoutStatusApiResponse } from "@/lib/core/checkout-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<CheckoutStatusApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const transactionId = request.nextUrl.searchParams.get("transactionId");
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const raw = await client.cart.getCheckoutStatus(transactionId);

    return NextResponse.json({ checkoutStatus: raw.checkout_status });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/checkout/status] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load checkout status. Please try again later." },
      { status: 502 }
    );
  }
}
