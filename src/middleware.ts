import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, LOGIN_PATH } from "@/lib/auth";

/**
 * Next.js middleware — gates all routes behind authentication.
 * Redirects unauthenticated users to the login page.
 */
export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL(LOGIN_PATH, request.url);

    // Preserve the original URL as a redirect param for deep links.
    // Skip for the root path since the login page defaults to "/" anyway.
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    if (originalPath !== "/") {
      loginUrl.searchParams.set("redirect", originalPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /login (the login page itself)
     * - /api/auth/:path* (login/logout API routes)
     * - /_next/:path* (Next.js internals: static files, HMR, etc.)
     * - /favicon.ico (browser icon request)
     */
    "/((?!login|api/auth|_next|favicon\\.ico).*)",
  ],
};
