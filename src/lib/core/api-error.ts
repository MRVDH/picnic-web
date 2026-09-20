/**
 * Shared authentication error detection utility.
 *
 * picnic-api builds the thrown message two different ways (see its
 * http-client). A JSON error body becomes just `error.message`, or the status
 * text when the body names none — no status code at all. A body that is not
 * JSON becomes `"<status> <statusText> - <body>"`, where the raw body is
 * appended to the message.
 *
 * The status code is therefore only ever a prefix, and must be matched as one.
 * Searching the whole message for "401" also finds it in the appended body — in
 * a quota, a trace id, a timestamp, a product id — so any failing request whose
 * body happened to carry those digits read as an expired token and sent the
 * user to the login page.
 *
 * Note what this does and does not settle. It stops unrelated failures from
 * being reported as an auth problem. It says nothing about a token Picnic
 * refuses for a few minutes after too many requests: that refusal's status code
 * has not been observed yet, and if it is a 401 this still treats it as an auth
 * error.
 */

/** Auth status codes, anchored: picnic-api always puts the status first. */
const AUTH_STATUS_PREFIX = /^(401|403)\b/;

/** Wording that identifies an auth failure when no status code is present. */
function hasAuthWording(message: string): boolean {
  return (
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("login failed")
  );
}

/**
 * Returns true if the error represents an authentication failure (401 or 403)
 * from the Picnic API, as opposed to a network/timeout/throttling/upstream
 * error. Only this must send the user back to the login page.
 */
export function isApiAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return AUTH_STATUS_PREFIX.test(message) || hasAuthWording(message);
}

/**
 * Returns true if the error indicates a 2FA-related failure — a superset of
 * the standard auth error patterns plus 2FA-specific messages.
 */
export function is2FAError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("2fa") || AUTH_STATUS_PREFIX.test(message) || hasAuthWording(message);
}
