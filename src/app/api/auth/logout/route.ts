import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import type { AuthApiResponse } from "@/lib/types";

/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie and returns success.
 */
export async function POST(): Promise<NextResponse<AuthApiResponse>> {
  const response = NextResponse.json<AuthApiResponse>({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
