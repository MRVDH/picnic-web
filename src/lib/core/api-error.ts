/**
 * Shared authentication error detection utility.
 *
 * The picnic-api HTTP client throws plain Error objects with the HTTP status
 * code embedded in the message string (e.g. "401 Unauthorized"). This utility
 * centralises that detection so every API route uses the same logic.
 */

/**
 * Returns true if the error represents an authentication failure (401 or 403)
 * from the Picnic API, as opposed to a network/timeout/upstream error.
 */
export function isApiAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("login failed")
    );
  }
  return false;
}

/**
 * Returns true if the error indicates a 2FA-related failure — a superset of
 * the standard auth error patterns plus 2FA-specific messages.
 */
export function is2FAError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("2fa") ||
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
    );
  }
  return false;
}
