/**
 * Shared detection of Picnic API errors.
 *
 * picnic-api throws a PicnicApiError for an error status, with the HTTP `status`,
 * Picnic's error `code` and the response `body`. Read those, not the message: a
 * wrong password is a 401 with code AUTH_INVALID_CRED, a wrong 2FA code a 400
 * with code OTP_NOT_VALID, and an expired token a 401.
 *
 * Sending many requests in a short window earns a "403 Forbidden" served as a
 * bare HTML error page from the edge in front of the API, and it lasts a minute
 * or two. Picnic's own auth failures come back as JSON, so the body tells the two
 * apart: HTML means the request never reached the API, and the session is still
 * good.
 */
import { isPicnicApiError } from "@/lib/core/picnic-client";

/** Picnic's error code for a wrong 2FA code, sent with HTTP 400. */
const OTP_NOT_VALID = "OTP_NOT_VALID";

/**
 * A block from the edge in front of Picnic's API rather than a decision by the
 * API itself, recognised by its HTML body. Throttling arrives this way, as a 403
 * whose body is nginx's default page, and it clears on its own after a minute or two.
 *
 * Signing the user out for one of these is wrong twice over: the token is fine,
 * and during the block they cannot sign back in anyway.
 */
export function isUpstreamBlockError(error: unknown): boolean {
  return isPicnicApiError(error) && /<html[\s>]/i.test(error.body);
}

/**
 * Returns true if the error is an authentication failure (401 or 403) from the
 * Picnic API, as opposed to a network/timeout/throttling/upstream error. Only
 * this must send the user back to the login page.
 */
export function isApiAuthError(error: unknown): boolean {
  return (
    isPicnicApiError(error) &&
    (error.status === 401 || error.status === 403) &&
    !isUpstreamBlockError(error)
  );
}

/** Returns true if a 2FA verification failed because of the code or the session. */
export function is2FAError(error: unknown): boolean {
  return (isPicnicApiError(error) && error.code === OTP_NOT_VALID) || isApiAuthError(error);
}
