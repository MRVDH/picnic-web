import type { Product, Badge, BadgeVariant } from "./types";

// ─── Decorator type guards ───────────────────────────────────────────────────
// The upstream SellingUnit.decorators is typed as `any[]`.
// We validate the `type` discriminant at runtime before accessing fields.

type DecoratorBase = { type: string };

function hasType(decorator: unknown): decorator is DecoratorBase {
  return (
    typeof decorator === "object" &&
    decorator !== null &&
    "type" in decorator &&
    typeof (decorator as DecoratorBase).type === "string"
  );
}

// ─── Decorator → Badge mapping ───────────────────────────────────────────────

type DecoratorMapping = {
  type: string;
  textField: string;
  variant: BadgeVariant;
};

const DECORATOR_MAPPINGS: DecoratorMapping[] = [
  { type: "LABEL", textField: "text", variant: "promo" },
  { type: "PRODUCT_SIZE", textField: "text", variant: "size" },
  { type: "FRESH_LABEL", textField: "period", variant: "freshness" },
  { type: "BASE_PRICE", textField: "base_price_text", variant: "unit-price" },
  { type: "VALIDITY_LABEL", textField: "valid_until", variant: "availability" },
];

function extractBadgeFromMapping(
  decorator: Record<string, unknown>,
  mapping: DecoratorMapping,
): Badge | null {
  const text = decorator[mapping.textField];
  if (typeof text !== "string" || text.trim() === "") {
    return null;
  }
  return { text: text.trim(), variant: mapping.variant };
}

function extractUnavailableBadge(
  decorator: Record<string, unknown>,
): Badge | null {
  const explanation = decorator.explanation as
    | { short_explanation?: string }
    | undefined;
  const text = explanation?.short_explanation ?? (decorator.reason as string);
  if (typeof text !== "string" || text.trim() === "") {
    return null;
  }
  return { text: text.trim(), variant: "availability" };
}

function extractCharacteristicsBadges(
  decorator: Record<string, unknown>,
): Badge[] {
  const characteristics = decorator.characteristics;
  if (!Array.isArray(characteristics)) {
    return [];
  }
  return characteristics
    .filter(
      (c): c is { type: string } =>
        typeof c === "object" && c !== null && typeof c.type === "string",
    )
    .map((c) => ({ text: c.type, variant: "info" as BadgeVariant }));
}

// ─── Extract original price from PRICE decorator ─────────────────────────────

function extractOriginalPrice(decorators: unknown[]): number | null {
  for (const decorator of decorators) {
    if (!hasType(decorator)) continue;
    if (decorator.type !== "PRICE") continue;

    const price = (decorator as Record<string, unknown>).display_price;
    if (typeof price === "number" && price > 0) {
      return price;
    }
  }
  return null;
}

// ─── Extract unavailability ──────────────────────────────────────────────────

function extractUnavailability(
  decorators: unknown[],
): { isUnavailable: boolean; reason: string | null } {
  for (const decorator of decorators) {
    if (!hasType(decorator)) continue;
    if (decorator.type !== "UNAVAILABLE") continue;

    const record = decorator as Record<string, unknown>;
    const explanation = record.explanation as
      | { short_explanation?: string }
      | undefined;
    const reason =
      explanation?.short_explanation ?? (record.reason as string) ?? null;

    return { isUnavailable: true, reason };
  }
  return { isUnavailable: false, reason: null };
}

// ─── Extract all badges from decorators ──────────────────────────────────────

function extractBadges(decorators: unknown[]): Badge[] {
  const badges: Badge[] = [];

  for (const decorator of decorators) {
    if (!hasType(decorator)) continue;

    const record = decorator as Record<string, unknown>;

    // Check known mappings first
    const mapping = DECORATOR_MAPPINGS.find((m) => m.type === decorator.type);
    if (mapping) {
      const badge = extractBadgeFromMapping(record, mapping);
      if (badge) badges.push(badge);
      continue;
    }

    // Special cases
    if (decorator.type === "UNAVAILABLE") {
      const badge = extractUnavailableBadge(record);
      if (badge) badges.push(badge);
      continue;
    }

    if (decorator.type === "PRODUCT_CHARACTERISTICS") {
      badges.push(...extractCharacteristicsBadges(record));
      continue;
    }

    // PRICE decorator is handled separately for original price, not as a badge.
    // Other decorator types (BANNERS, BACKGROUND_IMAGE, etc.) are visual-only
    // and not relevant for the product card badge display.
  }

  return badges;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * SellingUnit shape as returned by picnic-api catalog.search().
 * Re-declared here to avoid tight coupling to the upstream `any[]` decorators type.
 */
type RawSellingUnit = {
  id: string;
  name: string;
  image_id: string;
  display_price: number;
  unit_quantity: string;
  max_count: number;
  decorators: unknown[];
  price_ranges: unknown[] | null;
};

/**
 * Transforms an array of raw SellingUnit objects (from picnic-api) into
 * our application-level Product[] type.
 */
export function extractProducts(sellingUnits: RawSellingUnit[]): Product[] {
  return sellingUnits.map(extractSingleProduct);
}

function extractSingleProduct(unit: RawSellingUnit): Product {
  const decorators = unit.decorators ?? [];
  const originalPrice = extractOriginalPrice(decorators);
  const { isUnavailable, reason } = extractUnavailability(decorators);
  const badges = extractBadges(decorators);

  // If there's a PRICE decorator with a higher value than display_price,
  // that's the original (pre-discount) price. If it's the same or lower,
  // there's no discount.
  const hasDiscount =
    originalPrice !== null && originalPrice > unit.display_price;

  return {
    id: unit.id,
    name: unit.name,
    namePrefix: null,
    subtitle: null,
    brand: null,
    highlight: null,
    flagIconKey: null,
    flagFallbackImageId: null,
    imageId: unit.image_id,
    displayPrice: unit.display_price,
    originalPrice: hasDiscount ? originalPrice : null,
    unitQuantity: unit.unit_quantity,
    maxCount: unit.max_count,
    badges,
    isUnavailable,
    unavailableReason: reason,
  };
}
