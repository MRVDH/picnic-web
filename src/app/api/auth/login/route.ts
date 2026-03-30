import { NextRequest, NextResponse } from "next/server";
import { buildPicnicClient } from "@/lib/picnic-client";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth";
import type { AuthApiResponse } from "@/lib/types";

/**
 * POST /api/auth/login
 *
 * Validates a Picnic auth token by making a test API call.
 * On success, sets an HTTP-only cookie and returns { success: true }.
 * On failure, returns { success: false, error: <code> }.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthApiResponse>> {
  const body = await request.json().catch(() => null);
  const token: string | undefined = body?.token;

  if (!token || token.trim() === "") {
    return NextResponse.json({ success: false, error: "TOKEN_INVALID" });
  }

  try {
    const client = buildPicnicClient(token.trim());
    await client.catalog.getSuggestions("");

    const response = NextResponse.json<AuthApiResponse>({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token.trim(), {
      httpOnly: true,
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

/**
 * Check if the error indicates an authentication failure (401/403)
 * from the Picnic API, as opposed to a network/timeout error.
 */
function isApiAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
    );
  }
  return false;
}
