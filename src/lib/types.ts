// Application-level type definitions for the Picnic web client.
// These are our own domain types, decoupled from the upstream picnic-api types.
import type { SelectedSlotData } from "@/lib/delivery-slot-types";

export type { SelectedSlotData } from "@/lib/delivery-slot-types";

// ─── Constants ───────────────────────────────────────────────────────────────

export const CENTS_DIVISOR = 100;

export const SUPPORTED_COUNTRY_CODES = ["NL", "DE"] as const;
export type CountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];
export const DEFAULT_COUNTRY_CODE: CountryCode = "NL";

/** Cookie name for the selected Picnic country. */
export const COUNTRY_COOKIE_NAME = "picnic_country";

/** Build the Picnic image CDN base URL for a given country. */
export function getImageCdnBase(countryCode: CountryCode): string {
  return `https://storefront-prod.${countryCode.toLowerCase()}.picnicinternational.com/static/images`;
}

/** Validate a raw string value as a CountryCode, falling back to the default. */
export function parseCountryCode(value: string | undefined): CountryCode {
  const upper = value?.toUpperCase();
  if (upper && (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(upper)) {
    return upper as CountryCode;
  }
  return DEFAULT_COUNTRY_CODE;
}
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
  | "unit-price"
  | "bundle";

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
  /** Bundle price ranges from the API, or null if no bundle. */
  priceRanges: BundleThreshold[] | null;
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

export type CategoryProductsApiResponse = {
  title: string | null;
  products: Product[];
  sections: SearchSection[];
};

export type ApiErrorResponse = {
  error: string;
  code?: AuthErrorCode;
};

// ─── Product Detail ──────────────────────────────────────────────────────

/** Fusion page node IDs used by the product detail parser. */
export const PRODUCT_MAIN_CONTAINER_ID = "product-details-page-root-main-container";
export const PRODUCT_GALLERY_CONTAINER_ID = "product-page-image-gallery-main-image-container";
export const PRODUCT_DESCRIPTION_ID = "description";
export const PRODUCT_HIGHLIGHTS_ID = "product-page-highlights";
export const PRODUCT_ALLERGIES_ID = "product-page-allergies";
export const PRODUCT_ACCORDION_ID = "accordion-list";
export const PRODUCT_BUNDLES_PREFIX = "product-page-bundles-";
export const PRODUCT_ALTERNATIVES_ID = "alternatives-container";
export const PRODUCT_LABELS_PREFIX = "product-page-labels-";

/** A single allergen badge with its display color. */
export type AllergenBadge = {
  /** Allergen name (e.g. "Selderij", "Ei"). */
  text: string;
  /** Background hex color for the badge (e.g. "#1a9d63"). */
  backgroundColor: string;
  /** Text hex color for the badge (e.g. "#ffffff"). */
  textColor: string;
};

/** Categorized allergen data for a product. */
export type AllergenInfo = {
  /** Confirmed allergens (under "Bevat" heading). */
  confirmed: AllergenBadge[];
  /** "May contain" allergens (under "Bevat mogelijk" heading). */
  mayContain: AllergenBadge[];
};

/** A collapsible info section from the product detail accordion. */
export type ProductInfoSection = {
  /** Section header (e.g. "Ingrediënten", "Voedingswaarde"). */
  title: string;
  /** Section body as raw text (may contain markdown table syntax). */
  content: string;
};

/** An active promotion on a product. */
export type ProductPromotion = {
  /** Promotion identifier. */
  id: string;
  /** Human-readable promotion label (e.g. "1+1 gratis"). */
  label: string;
};

/** A bundle pricing option (buy-more-pay-less). */
export type BundleOption = {
  /** Selling unit ID for this bundle option. */
  id: string;
  /** Number of items in this bundle (1-indexed). */
  quantity: number;
  /** Price per unit in euro cents. */
  pricePerUnit: number;
  /** Product image ID for this bundle option. */
  imageId: string;
  /** Maximum cart quantity for this bundle. */
  maxCount: number;
};

/** A condensed product reference for slider displays. */
export type SliderProduct = {
  /** Selling unit ID. */
  id: string;
  /** Product name. */
  name: string;
  /** Product image ID. */
  imageId: string;
  /** Price in euro cents. */
  displayPrice: number;
  /** Unit quantity description (e.g. "6 x 330 ml"). */
  unitQuantity: string;
  /** Maximum cart quantity. */
  maxCount: number;
  /** Deposit amount in cents, if applicable. */
  deposit?: number;
};

/** A label/badge displayed on the product detail page (e.g. "Biologisch", "50% korting"). */
export type ProductLabel = {
  /** Label text. */
  text: string;
  /** Text hex color (e.g. "#4B8505"). */
  textColor: string;
  /** Background hex color (e.g. "#fbd92b"). */
  backgroundColor: string;
};

/** A highlight item with optional icon and link. */
export type ProductHighlightItem = {
  /** Display text (may contain **bold** markdown). */
  text: string;
  /** PML icon key (e.g. "starsOutlined", "pin"). Null if no icon. */
  iconKey: string | null;
  /** Deep-link target for TOUCHABLE highlights. Null if not a link. */
  linkTarget: string | null;
};

/** A row in a structured nutrition table. */
export type NutritionRow = {
  /** Left label (e.g. "Energie", "Vet"). */
  label: string;
  /** Right value (e.g. "557 kJ /", "5,7g"). Null for header-only rows. */
  value: string | null;
  /** Whether this is a main category (HEADLINE2) vs sub-item (BODY2). */
  isCategory: boolean;
  /** Background color for zebra striping, or null. */
  backgroundColor: string | null;
};

/** Comprehensive product detail displayed on the product detail page. */
export type ProductDetail = {
  /** Selling unit ID (e.g. "s1001524"). */
  id: string;
  /** Product name. */
  name: string;
  /** Brand/producer name. Empty string if unavailable. */
  brand: string;
  /** Unit quantity description (e.g. "6 x 300 ml"). */
  unitQuantity: string;
  /** Unit price description (e.g. "€4.81/l"). Null if not available. */
  unitPrice: string | null;
  /** Category tag text (e.g. "Diepvries") with color. Null if not available. */
  categoryTag: { text: string; color: string } | null;
  /** Selling price in euro cents. */
  displayPrice: number;
  /** Original price in cents before discount, or null. */
  originalPrice: number | null;
  /** Maximum items that can be added to cart. */
  maxCount: number;
  /** Gallery image IDs. May be empty. */
  imageIds: string[];
  /** Product labels/badges (e.g. "Biologisch", "50% korting"). */
  labels: ProductLabel[];
  /** Product description text. Null if not available. */
  description: string | null;
  /** Highlight items with icons and optional links. May be empty. */
  highlights: ProductHighlightItem[];
  /** Categorized allergen data. */
  allergens: AllergenInfo;
  /** Collapsible accordion sections. May be empty. */
  infoSections: ProductInfoSection[];
  /** Active promotion, if any. */
  promotion: ProductPromotion | null;
  /** Bundle pricing options. May be empty. */
  bundles: BundleOption[];
  /** Alternative/similar products. May be empty. */
  similarProducts: SliderProduct[];
  /** Structured nutrition rows (extracted from Voedingswaarde). May be empty. */
  nutritionRows: NutritionRow[];
};

// ─── Cart ────────────────────────────────────────────────────────────────────

/** A single line item in the cart, derived from raw order line + article objects. */
export type CartItem = {
  /** Order line identifier. */
  id: string;
  /** Product/article identifier (used for product detail link). */
  productId: string;
  /** Product name. */
  name: string;
  /** Unit quantity string (e.g. "500 g"). */
  unitQuantity: string;
  /** Primary image ID (first in array, or empty string). */
  imageId: string;
  /** Current price in cents (display_price from order line). */
  displayPrice: number;
  /** Original price in cents when discounted, or null. */
  originalPrice: number | null;
  /** Quantity in cart (from QUANTITY decorator, default 1). */
  quantity: number;
  /** Maximum allowed quantity for this product (from API max_count). */
  maxCount: number;
  /** Decorator-derived badges (discount labels, freshness, base price, bundle). */
  badges: Badge[];
  /** Whether the item is currently unavailable. */
  isUnavailable: boolean;
  /** Short unavailability reason, or null. */
  unavailableExplanation: string | null;
  /** Replacement product suggestions for unavailable items. */
  replacements: SliderProduct[];
};

/** A single deposit category entry in the deposit breakdown. */
export type DepositEntry = {
  /** Deposit category (e.g. "BAG", "DEFAULT"). */
  type: string;
  /** Price per unit in cents. */
  value: number;
  /** Number of deposit units. */
  count: number;
  /** Total deposit for this category in cents (value × count). */
  total: number;
};

/** A fee or credit line from the cart API (e.g. Picnic credit settlement). */
export type FeeEntry = {
  /** Fee type identifier from the API (e.g. "SALDO"). */
  type: string;
  /** Display label from the API (e.g. "Verrekening Picnic-tegoed"). */
  name: string;
  /** Amount in cents. Negative values represent deductions/credits. */
  amount: number;
};

/** Top-level display model returned by the /api/cart route. */
export type CartData = {
  /** All cart line items with decorator badges merged. */
  items: CartItem[];
  /** Total order price in cents (checkout_total_price, includes fees and deposits). */
  totalPrice: number;
  /** Total number of items in cart. */
  totalCount: number;
  /** Sum of per-line (price − display_price) savings in cents. */
  totalDiscount: number;
  /** Sum of all deposit entries in cents. */
  depositTotal: number;
  /** Per-type deposit breakdown. */
  depositBreakdown: DepositEntry[];
  /** Membership savings in cents (0 if none). */
  membershipSavings: number;
  /** Fee/credit lines from the API (e.g. Picnic credit settlement). */
  fees: FeeEntry[];
  /** Minimum order value in cents for the selected delivery slot, or null. */
  minimumOrderValue: number | null;
  /** "Niets vergeten?" suggestion products; empty array if unavailable. */
  suggestions: SliderProduct[];
  /** Selected delivery slot summary for the banner. Null when no slot data. */
  selectedSlot: SelectedSlotData | null;
  /** Pre-formatted banner text: prompt or formatted time window. */
  deliveryBannerText: string;
};

/** Alias: the /api/cart route returns CartData directly. */
export type CartApiResponse = CartData;

// ─── Cart Mutations (PLP Cart Actions) ──────────────────────────────────────

/** Request body for adding or removing products from the cart via POST /api/cart. */
export type CartMutationRequest = {
  /** Selling unit ID (e.g. "s1013635"). */
  productId: string;
  /** Whether to add or remove units. */
  action: "add" | "remove";
  /** Number of units to add or remove (typically 1). */
  count: number;
};

// ─── Bundle Progress (PLP Cart Actions) ─────────────────────────────────────

/** A single tier in a bundle pricing scheme. */
export type BundleThreshold = {
  /** Number of units needed to unlock this tier. */
  quantity: number;
  /** Price per unit in cents at this tier. */
  pricePerUnit: number;
};

/** Bundle discount progress for a single product. */
export type BundleProgress = {
  /** The product this bundle applies to. */
  productId: string;
  /** Ordered list of bundle tiers (ascending by quantity). */
  thresholds: BundleThreshold[];
  /** Current quantity in cart. */
  currentQuantity: number;
};

// ─── Cookbook / Recipes ──────────────────────────────────────────────────────

export type RecipeItem = {
  id: string;
  name: string;
  imageId: string | null;
  cookingTimeMinutes: number | null;
};

export type RecipeCategory = {
  id: string;
  name: string;
  count?: number;
};

export type CookbookApiResponse = {
  categories: RecipeCategory[];
  recipes: RecipeItem[];
};

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Error codes returned by API routes for auth-related failures. */
export type AuthErrorCode = "TOKEN_EXPIRED" | "TOKEN_INVALID" | "API_UNREACHABLE";

/** Response shape from the /api/auth/login route. */
export type AuthApiResponse =
  | { success: true }
  | { success: false; error: string }
  | { success: false; error: "2FA_REQUIRED"; partialToken: string };
