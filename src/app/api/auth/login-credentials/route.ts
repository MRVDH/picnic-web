import { NextRequest, NextResponse } from "next/server";
import { buildPicnicClient, buildPicnicClientAnonymous } from "@/lib/picnic-client";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth";
import type { AuthApiResponse } from "@/lib/types";
import { isApiAuthError } from "@/lib/api-error";

/**
 * POST /api/auth/login-credentials
 *
 * Authenticates with the Picnic API using email + password.
 * If 2FA is required, triggers an SMS code and returns { success: false, error: "2FA_REQUIRED", partialToken }.
 * If 2FA is not required, validates the token and sets the auth cookie.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthApiResponse>> {
  const body = await request.json().catch(() => null);
  const email: string | undefined = body?.email;
  const password: string | undefined = body?.password;

  if (!email || email.trim() === "" || !password || password.trim() === "") {
    return NextResponse.json({
      success: false,
      error: "CREDENTIALS_INVALID",
    });
  }

  try {
    const client = buildPicnicClientAnonymous();
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
      return NextResponse.json({
        success: false,
        error: "2FA_REQUIRED" as const,
        partialToken: authKey,
      });
    }

    // No 2FA required — validate the token before storing it.
    const validatedClient = buildPicnicClient(authKey);
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
    if (isApiAuthError(error)) {
      return NextResponse.json({
        success: false,
        error: "CREDENTIALS_INVALID",
      });
    }

    return NextResponse.json({ success: false, error: "API_UNREACHABLE" });
  }
}
