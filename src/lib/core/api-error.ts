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
 * The status code alone is not enough either. Sending many requests in a short
 * window earns a "403 Forbidden" served as a bare HTML error page from the edge
 * in front of the API, and it lasts a minute or two. Picnic's own auth failures
 * come back as JSON, so the body tells the two apart: HTML means the request
 * never reached the API, and the session is still good.
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
 * A block from the edge in front of Picnic's API rather than a decision by the
 * API itself, recognised by its body: the API answers in JSON, while the edge
 * serves a plain HTML error page. Throttling arrives this way, as a 403 whose
 * body is nginx's default page, and it clears on its own after a minute or two.
 *
 * Signing the user out for one of these is wrong twice over: the token is fine,
 * and during the block they cannot sign back in anyway.
 */
export function isUpstreamBlockError(error: unknown): boolean {
  return error instanceof Error && /<html[\s>]/i.test(error.message);
}

/**
 * Returns true if the error represents an authentication failure (401 or 403)
 * from the Picnic API, as opposed to a network/timeout/throttling/upstream
 * error. Only this must send the user back to the login page.
 */
export function isApiAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (isUpstreamBlockError(error)) return false;
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
