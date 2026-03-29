// Application-level type definitions for the Picnic web client.
// These are our own domain types, decoupled from the upstream picnic-api types.

// ─── Constants ───────────────────────────────────────────────────────────────

export const CENTS_DIVISOR = 100;
export const COUNTRY_CODE = "NL";
export const IMAGE_CDN_BASE = `https://storefront-prod.${COUNTRY_CODE}.picnicinternational.com/static/images`;
export const DEFAULT_IMAGE_SIZE = "medium";
export const DEBOUNCE_DELAY_MS = 300;
export const MIN_SUGGESTION_LENGTH = 2;
export const SECTION_ID_PREFIX = "section";

/** Build a stable DOM id for a search result section by its index. */
export function buildSectionId(index: number): string {
  return `${SECTION_ID_PREFIX}-${index}`;
}

// ─── Badge / Label ───────────────────────────────────────────────────────────

export type BadgeVariant =
  | "promo"
  | "discount"
  | "size"
  | "freshness"
  | "availability"
  | "info"
  | "unit-price";

export type Badge = {
  text: string;
  variant: BadgeVariant;
};

// ─── Highlight (colored subtext) ─────────────────────────────────────────────

export type Highlight = {
  /** The text to display (e.g. "Prijskampioen"). */
  text: string;
  /** Hex color for the text (e.g. "#B40117" for red). */
  color: string;
};

// ─── Product ─────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  /** Prefix shown before the name in a distinct style (e.g. "Bio" in green). */
  namePrefix: string | null;
  /** Small subtitle above the product name (e.g. "D.O.P. Sarnese-Nocerino"). */
  subtitle: string | null;
  /** Brand name shown below the product name (e.g. "Mutti"). */
  brand: string | null;
  /** Colored subtext like "Prijskampioen" shown in the brand/subtext row. */
  highlight: Highlight | null;
  /** Icon key for a flag shown next to the brand (e.g. "flagGermany"). */
  flagIconKey: string | null;
  /** Fallback image ID for the flag icon, from the CDN. */
  flagFallbackImageId: string | null;
  imageId: string;
  /** Current display price in cents. */
  displayPrice: number;
  /** Original price in cents when discounted, or null. */
  originalPrice: number | null;
  /** Human-readable unit/quantity string (e.g. "500 g", "6 x 300 ml"). */
  unitQuantity: string;
  /** Maximum number of units a user can order. */
  maxCount: number;
  /** All labels/badges extracted from decorators. */
  badges: Badge[];
  /** Whether the product is currently unavailable. */
  isUnavailable: boolean;
  /** Reason for unavailability, if applicable. */
  unavailableReason: string | null;
};

// ─── Search ──────────────────────────────────────────────────────────────────

export type SearchSection = {
  /** Display text for the section header (e.g., "Cherrytomaten"). */
  title: string;
  /** Products in this section, in API order. Always non-empty. */
  products: Product[];
};

export type SearchResult = {
  products: Product[];
  sections: SearchSection[];
  query: string;
};

export type SearchSuggestion = {
  id: string;
  suggestion: string;
};

// ─── API Response Shapes ─────────────────────────────────────────────────────

export type SearchApiResponse = {
  products: Product[];
  sections: SearchSection[];
  query: string;
};

export type SuggestionsApiResponse = {
  suggestions: SearchSuggestion[];
  query: string;
};

export type ApiErrorResponse = {
  error: string;
};
