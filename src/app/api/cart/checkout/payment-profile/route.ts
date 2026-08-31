import { NextRequest, NextResponse } from "next/server";

import { parsePaymentProfile } from "@/lib/checkout/parse-checkout";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { PaymentProfileApiResponse } from "@/lib/core/checkout-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<PaymentProfileApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const raw = await client.payment.getPaymentProfile();
    return NextResponse.json(parsePaymentProfile(raw));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/checkout/payment-profile] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load payment profile. Please try again later." },
      { status: 502 }
    );
  }
}
