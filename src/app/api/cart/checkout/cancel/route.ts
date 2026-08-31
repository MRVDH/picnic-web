import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: true } | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  let transactionId: string;
  try {
    const body = (await request.json()) as { transactionId?: unknown };
    if (typeof body.transactionId !== "string" || !body.transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }
    transactionId = body.transactionId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    await client.cart.cancelCheckout(transactionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/checkout/cancel] Failed:", message);

    return NextResponse.json(
      { error: "Failed to cancel checkout. Please try again later." },
      { status: 502 }
    );
  }
}
