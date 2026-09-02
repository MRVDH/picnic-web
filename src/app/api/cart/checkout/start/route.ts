import { NextRequest, NextResponse } from "next/server";

import { isCheckoutIssueError, mapCheckoutIssue } from "@/lib/checkout/checkout-issue";
import { parseCheckoutStart } from "@/lib/checkout/parse-checkout";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type {
  CheckoutIssueApiResponse,
  CheckoutStartApiResponse,
} from "@/lib/core/checkout-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<CheckoutStartApiResponse | CheckoutIssueApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  let mts: number | undefined;
  let resolveKey: string | undefined;
  try {
    const body = (await request.json()) as { mts?: unknown; resolveKey?: unknown };
    if (typeof body.mts === "number") mts = body.mts;
    if (typeof body.resolveKey === "string" && body.resolveKey.length > 0) {
      resolveKey = body.resolveKey;
    }
  } catch {
    // Empty body is fine — mts will be read from cart.
  }

  try {
    const client = buildPicnicClient(token, countryCode);

    if (mts === undefined) {
      const cart = await client.cart.getCart();
      mts = cart.mts;
    }

    const raw = await client.cart.startCheckout({
      mts,
      ...(resolveKey ? { resolve_key: resolveKey } : {}),
    });

    return NextResponse.json(parseCheckoutStart(raw));
  } catch (error) {
    if (isCheckoutIssueError(error)) {
      return NextResponse.json({ issue: mapCheckoutIssue(error) }, { status: 409 });
    }

    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/checkout/start] Failed:", message);

    return NextResponse.json({ error: "Failed to start checkout. Please try again later." }, { status: 502 });
  }
}
