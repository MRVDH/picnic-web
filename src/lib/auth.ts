import { NextRequest } from "next/server";

// ─── Auth Constants ──────────────────────────────────────────────────────────

/** Cookie name for the Picnic auth token. */
export const AUTH_COOKIE_NAME = "picnic_auth_token";

/** Cookie max-age in seconds (30 days). */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Path to the login page. */
export const LOGIN_PATH = "/login";

// ─── Cookie Utilities ────────────────────────────────────────────────────────

/**
 * Read the auth token from the request's cookies.
 * Returns null if the cookie is missing or empty.
 */
export function readAuthToken(request: NextRequest): string | null {
  const value = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!value || value.trim() === "") {
    return null;
  }
  return value;
}
