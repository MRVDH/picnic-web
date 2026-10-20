import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { ProfileApiResponse } from "@/lib/core/user-types";
import { mapProfile } from "@/lib/user/map-profile";

/**
 * GET /api/user/profile
 *
 * Returns the profile summary and the account menu (entry ids and deep links,
 * in app order), from picnic-api's user.getProfile.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ProfileApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    return NextResponse.json(mapProfile(await client.user.getProfile()));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/user/profile] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load profile. Please try again later." },
      { status: 502 }
    );
  }
}
