import { NextRequest, NextResponse } from "next/server";

import { is2FAError } from "@/lib/api-error";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { AuthApiResponse } from "@/lib/types";

/**
 * POST /api/auth/verify-2fa
 *
 * Completes 2FA verification using the partial auth token from the
 * credentials login step and the SMS code entered by the user.
 * On success, sets the auth cookie with the fully-authenticated token.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthApiResponse>> {
  const body = await request.json().catch(() => null);
  const partialToken: string | undefined = body?.partialToken;
  const code: string | undefined = body?.code;
  const countryCode = readCountryCode(request);

  if (!partialToken || !code || code.trim() === "") {
    return NextResponse.json({
      success: false,
      error: "2FA_INVALID",
    });
  }

  try {
    // Build a client with the pre-2FA partial token so it is sent
    // in the x-picnic-auth header during verification.
    const client = buildPicnicClient(partialToken, countryCode);
    const result = await client.auth.verify2FACode(code.trim());

    const authKey = result.authKey;
    if (!authKey) {
      return NextResponse.json({
        success: false,
        error: "2FA_INVALID",
      });
    }

    // Validate the fully-authenticated token before storing it.
    const validatedClient = buildPicnicClient(authKey, countryCode);
    await validatedClient.catalog.getSuggestions("");

    const response = NextResponse.json<AuthApiResponse>({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, authKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    if (is2FAError(error)) {
      return NextResponse.json({
        success: false,
        error: "2FA_INVALID",
      });
    }

    return NextResponse.json({ success: false, error: "API_UNREACHABLE" });
  }
}
