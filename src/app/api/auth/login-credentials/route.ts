import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, readCountryCode } from "@/lib/auth";
import { buildPicnicClient, buildPicnicClientAnonymous } from "@/lib/picnic-client";
import type { AuthApiResponse } from "@/lib/types";
import { COUNTRY_COOKIE_NAME, type CountryCode, SUPPORTED_COUNTRY_CODES } from "@/lib/types";

/**
 * POST /api/auth/login-credentials
 *
 * Authenticates with the Picnic API using email + password.
 * If 2FA is required, triggers an SMS code and returns { success: false, error: "2FA_REQUIRED", partialToken }.
 * If 2FA is not required, validates the token and sets the auth cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthApiResponse>> {
  const body = await request.json().catch(() => null);
  const email: string | undefined = body?.email;
  const password: string | undefined = body?.password;
  const rawCode = String(body?.countryCode ?? "").toUpperCase();
  const countryCode: CountryCode = (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(rawCode)
    ? (rawCode as CountryCode)
    : readCountryCode(request);

  if (!email || email.trim() === "" || !password || password.trim() === "") {
    return NextResponse.json({
      success: false,
      error: "CREDENTIALS_INVALID",
    });
  }

  const cookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  };

  try {
    const client = buildPicnicClientAnonymous(countryCode);
    const result = await client.auth.login(email.trim(), password);

    const authKey = result.authKey;
    if (!authKey) {
      return NextResponse.json({
        success: false,
        error: "CREDENTIALS_INVALID",
      });
    }

    if (result.second_factor_authentication_required) {
      // Trigger the 2FA SMS code, then return the partial token to the client
      // so it can be used in the /api/auth/verify-2fa step.
      await client.auth.generate2FACode("SMS");
      // Store the country cookie now so verify-2fa can read it.
      const response = NextResponse.json<AuthApiResponse>({
        success: false,
        error: "2FA_REQUIRED" as const,
        partialToken: authKey,
      });
      response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, cookieOptions);
      return response;
    }

    // No 2FA required — validate the token before storing it.
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
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, cookieOptions);

    return response;
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({
        success: false,
        error: "CREDENTIALS_INVALID",
      });
    }

    return NextResponse.json({ success: false, error: "API_UNREACHABLE" });
  }
}
