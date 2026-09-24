import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { ReferralApiResponse } from "@/lib/core/user-types";
import { parseReferral } from "@/lib/user/parse-referral";

/**
 * GET /api/user/referral
 *
 * Returns the user's Vriendenkorting code, the amounts it's worth and the
 * link the app shares. 404 when the account has no code.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ReferralApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const referral = parseReferral(await client.user.getProfileMenu());

    if (!referral) {
      return NextResponse.json({ error: "No referral code for this account." }, { status: 404 });
    }
    return NextResponse.json(referral);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/user/referral] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load your referral code. Please try again later." },
      { status: 502 }
    );
  }
}
