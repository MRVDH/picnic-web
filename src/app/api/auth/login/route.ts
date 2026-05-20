import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { AuthApiResponse } from "@/lib/types";
import { COUNTRY_COOKIE_NAME, type CountryCode, SUPPORTED_COUNTRY_CODES } from "@/lib/types";

/**
 * POST /api/auth/login
 *
 * Validates a Picnic auth token by making a test API call.
 * On success, sets an HTTP-only cookie and returns { success: true }.
 * On failure, returns { success: false, error: <code> }.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthApiResponse>> {
  const body = await request.json().catch(() => null);
  const token: string | undefined = body?.token;
  // Prefer the country from the request body (set by the login page selector);
  // fall back to the existing cookie if absent.
  const rawCode = String(body?.countryCode ?? "").toUpperCase();
  const countryCode: CountryCode = (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(rawCode)
    ? (rawCode as CountryCode)
    : readCountryCode(request);

  if (!token || token.trim() === "") {
    return NextResponse.json({ success: false, error: "TOKEN_INVALID" });
  }

  try {
    const client = buildPicnicClient(token.trim(), countryCode);
    await client.catalog.getSuggestions("");

    const response = NextResponse.json<AuthApiResponse>({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const isAuthError = isApiAuthError(error);

    if (isAuthError) {
      return NextResponse.json({ success: false, error: "TOKEN_INVALID" });
    }

    return NextResponse.json({ success: false, error: "API_UNREACHABLE" });
  }
}
