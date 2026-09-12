/** Redirect URL used when a Picnic auth token has expired. */
export const TOKEN_EXPIRED_REDIRECT = "/login?expired=true";

/** Error message string used to signal a token-expired condition. */
export const TOKEN_EXPIRED_MESSAGE = "TOKEN_EXPIRED";

/** Application name displayed in browser tab titles. */
export const APP_NAME = "Picnic Web";

/** Separator between page context and app name in titles. */
export const TITLE_SEPARATOR = " - ";

/** Maximum character length for page context before truncation. */
export const MAX_TITLE_CONTEXT_LENGTH = 60;

/** sessionStorage key for checkout payment session (order + transaction ids). */
export const CHECKOUT_STORAGE_KEY = "picnic_checkout_session";

/**
 * Max recipes fetched per meal-plan search call. Keeps the lightweight
 * per-candidate page fetch fast and avoids hammering the Picnic API; the
 * combination search's exhaustive/greedy split handles pools this size fine.
 */
export const MEAL_PLAN_MAX_CANDIDATES = 40;
