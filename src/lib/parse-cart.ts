/**
 * Cart response transformer.
 *
 * Accepts the raw `unknown` response from `sendRequest("GET", "/cart")` and
 * validates/extracts fields at runtime, returning a strongly-typed CartData.
 * No picnic-api types are imported for casting — all field access is defensive.
 */

import type { CartData, CartItem, DepositEntry, Badge, SliderProduct } from "@/lib/types";

// ─── Type guards ──────────────────────────────────────────────────────────────

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

function asString(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

function asNumber(val: unknown, fallback = 0): number {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

function asArray(val: unknown): unknown[] {
  return isArray(val) ? val : [];
}

// ─── Decorator helpers ────────────────────────────────────────────────────────

type RawDecorator = Record<string, unknown>;

function getDecorators(item: Record<string, unknown>): RawDecorator[] {
  return asArray(item["decorators"]).filter(isObject);
}

/**
 * Merge decorator_overrides into an item's decorators array.
 * Overrides replace matching-type decorators; new types are appended.
 */
function mergeOverrides(
  decorators: RawDecorator[],
  overrides: RawDecorator[],
): RawDecorator[] {
  if (overrides.length === 0) return decorators;
  const result = [...decorators];
  for (const override of overrides) {
    const overrideType = asString(override["type"]);
    const existingIdx = result.findIndex(
      (d) => asString(d["type"]) === overrideType,
    );
    if (existingIdx >= 0) {
      result[existingIdx] = override;
    } else {
      result.push(override);
    }
  }
  return result;
}

/**
 * Apply decorator_overrides from the top-level response to each order line and
 * its articles by matching the map key to item id fields.
 */
function applyDecoratorOverrides(
  items: unknown[],
  overridesMap: Record<string, unknown>,
): unknown[] {
  return items.map((rawLine) => {
    if (!isObject(rawLine)) return rawLine;

    const lineId = asString(rawLine["id"]);
    const lineOverrides = asArray(overridesMap[lineId]).filter(isObject);
    const mergedLineDecorators = mergeOverrides(
      getDecorators(rawLine),
      lineOverrides,
    );

    // Collect display_price / price from PRICE decorator overrides at both the
    // line level and the article level, so the reconstructed line carries the
    // correct scalar values for mapOrderLineToCartItem.
    let overrideDisplayPrice: number | undefined;
    let overridePrice: number | undefined;

    // Check line-level overrides for a PRICE decorator
    for (const ov of lineOverrides) {
      if (typeof ov["display_price"] === "number") {
        overrideDisplayPrice = ov["display_price"] as number;
      }
      if (typeof ov["price"] === "number") {
        overridePrice = ov["price"] as number;
      }
    }

    // Also apply overrides to nested articles
    const articles = asArray(rawLine["items"]).map((rawArticle) => {
      if (!isObject(rawArticle)) return rawArticle;
      const articleId = asString(rawArticle["id"]);
      const articleOverrides = asArray(overridesMap[articleId]).filter(isObject);

      // Check article-level overrides for a PRICE decorator whose display_price
      // should be promoted to the line (e.g. Olijfolie €1 korting, Keukenpapier
      // bundle discount).
      for (const ov of articleOverrides) {
        if (typeof ov["display_price"] === "number") {
          overrideDisplayPrice = ov["display_price"] as number;
        }
        if (typeof ov["price"] === "number") {
          overridePrice = ov["price"] as number;
        }
      }

      return {
        ...rawArticle,
        decorators: mergeOverrides(getDecorators(rawArticle), articleOverrides),
      };
    });

    // Build the reconstructed line, overwriting display_price / price when an
    // override (line-level or article-level) provided corrected values.
    const lineScalarOverrides: Record<string, unknown> = {};
    if (overrideDisplayPrice !== undefined) {
      lineScalarOverrides["display_price"] = overrideDisplayPrice;
    }
    if (overridePrice !== undefined) {
      lineScalarOverrides["price"] = overridePrice;
    }

    return {
      ...rawLine,
      ...lineScalarOverrides,
      decorators: mergedLineDecorators,
      items: articles,
    };
  });
}

// ─── Badge mapping ────────────────────────────────────────────────────────────

function mapDecoratorsToBadges(decorators: RawDecorator[]): Badge[] {
  const badges: Badge[] = [];
  for (const dec of decorators) {
    const type = asString(dec["type"]);
    switch (type) {
      case "LABEL":
      case "PROMO": {
        const text = asString(dec["text"]);
        if (text) badges.push({ text, variant: "promo" });
        break;
      }
      case "FRESH_LABEL": {
        const period = asString(dec["period"]);
        if (period) badges.push({ text: period, variant: "freshness" });
        break;
      }
      case "BASE_PRICE": {
        const basePriceText = asString(dec["base_price_text"]);
        if (basePriceText)
          badges.push({ text: basePriceText, variant: "unit-price" });
        break;
      }
      case "BUNDLES_BUTTON":
        badges.push({ text: "Bundel", variant: "info" });
        break;
    }
  }
  return badges;
}

// ─── Quantity extraction ──────────────────────────────────────────────────────

function extractQuantity(decorators: RawDecorator[]): number {
  const quantityDec = decorators.find(
    (d) => asString(d["type"]) === "QUANTITY",
  );
  if (quantityDec) {
    return asNumber(quantityDec["quantity"], 1);
  }
  return 1;
}

// ─── Unavailability extraction ────────────────────────────────────────────────

type UnavailableInfo = {
  isUnavailable: boolean;
  unavailableExplanation: string | null;
  replacements: SliderProduct[];
};

function extractUnavailableInfo(decorators: RawDecorator[]): UnavailableInfo {
  const unavailableDec = decorators.find(
    (d) => asString(d["type"]) === "UNAVAILABLE",
  );

  if (!unavailableDec) {
    return { isUnavailable: false, unavailableExplanation: null, replacements: [] };
  }

  const explanation = isObject(unavailableDec["explanation"])
    ? asString(unavailableDec["explanation"]["short_explanation"], null as unknown as string)
    : null;

  const replacements = asArray(unavailableDec["replacements"])
    .filter(isObject)
    .map(mapRawToSliderProduct)
    .filter((p): p is SliderProduct => p !== null);

  return {
    isUnavailable: true,
    unavailableExplanation: explanation || null,
    replacements,
  };
}

// ─── SliderProduct mapping ────────────────────────────────────────────────────

function mapRawToSliderProduct(raw: Record<string, unknown>): SliderProduct | null {
  const id = asString(raw["id"]);
  if (!id) return null;
  const imageIds = asArray(raw["image_ids"]);
  return {
    id,
    name: asString(raw["name"]),
    imageId: typeof imageIds[0] === "string" ? imageIds[0] : "",
    displayPrice: asNumber(raw["display_price"]),
    unitQuantity: asString(raw["unit_quantity"]),
    maxCount: asNumber(raw["max_count"], 99),
  };
}

// ─── Deposit breakdown ────────────────────────────────────────────────────────

function mapDepositBreakdown(raw: unknown): DepositEntry[] {
  return asArray(raw)
    .filter(isObject)
    .map((entry) => {
      const value = asNumber(entry["value"]);
      const count = asNumber(entry["count"]);
      return {
        type: asString(entry["type"]),
        value,
        count,
        total: value * count,
      };
    });
}

// ─── Minimum order value ──────────────────────────────────────────────────────

function extractMinimumOrderValue(raw: Record<string, unknown>): number | null {
  const selectedSlot = raw["selected_slot"];
  if (!isObject(selectedSlot)) return null;

  const slotId = asString(selectedSlot["slot_id"]);
  if (!slotId) return null;

  const deliverySlots = asArray(raw["delivery_slots"]);
  const matchedSlot = deliverySlots
    .filter(isObject)
    .find((slot) => asString(slot["slot_id"]) === slotId);

  if (!matchedSlot) return null;

  const mov = matchedSlot["minimum_order_value"];
  if (typeof mov !== "number") return null;

  return mov;
}

// ─── Suggestions from basket_sections ────────────────────────────────────────

function extractSuggestions(raw: Record<string, unknown>): SliderProduct[] {
  const sections = asArray(raw["basket_sections"]);
  const suggestions: SliderProduct[] = [];

  for (const section of sections) {
    if (!isObject(section)) continue;

    // Look for items inside the section — may be nested in various ways
    const items = asArray(section["items"] ?? section["products"] ?? []);
    for (const item of items) {
      if (!isObject(item)) continue;

      // Try direct product shape first
      const mapped = mapRawToSliderProduct(item);
      if (mapped) {
        suggestions.push(mapped);
        continue;
      }

      // Try nested article
      const articles = asArray(item["items"]);
      for (const article of articles) {
        if (!isObject(article)) continue;
        const mappedArticle = mapRawToSliderProduct(article);
        if (mappedArticle) suggestions.push(mappedArticle);
      }
    }
  }

  return suggestions;
}

// ─── Order line → CartItem ────────────────────────────────────────────────────

function mapOrderLineToCartItem(rawLine: unknown): CartItem | null {
  if (!isObject(rawLine)) return null;

  const lineId = asString(rawLine["id"]);
  if (!lineId) return null;

  const lineDecorators = getDecorators(rawLine);

  // Extract the first article for product-level data
  const articles = asArray(rawLine["items"]).filter(isObject);
  const firstArticle = articles[0];

  // Merge article-level decorators into the effective decorator list so that
  // decorators arriving via decorator_overrides keyed to an article ID (e.g.
  // UNAVAILABLE on Prosecco, LABEL on Olijfolie) are visible when mapping
  // badges, quantity, and unavailability.  Line-level decorators take
  // precedence: start from article decorators, then override with line ones.
  const articleDecorators = firstArticle ? getDecorators(firstArticle) : [];
  const effectiveDecorators = mergeOverrides(articleDecorators, lineDecorators);

  const productId = firstArticle ? asString(firstArticle["id"]) : "";
  const name = firstArticle ? asString(firstArticle["name"]) : asString(rawLine["name"]);
  const unitQuantity = firstArticle
    ? asString(firstArticle["unit_quantity"])
    : asString(rawLine["unit_quantity"]);

  const imageIds = firstArticle ? asArray(firstArticle["image_ids"]) : [];
  const imageId = typeof imageIds[0] === "string" ? imageIds[0] : "";

  // Price — prefer the line's scalar field (which applyDecoratorOverrides may
  // have updated), but fall back to a PRICE decorator's display_price if present.
  let displayPrice = asNumber(rawLine["display_price"]);
  const rawPrice = asNumber(rawLine["price"]);

  const priceDec = effectiveDecorators.find(
    (d) => asString(d["type"]) === "PRICE",
  );
  if (priceDec && typeof priceDec["display_price"] === "number") {
    displayPrice = priceDec["display_price"] as number;
  }

  const originalPrice = rawPrice !== displayPrice ? rawPrice : null;

  // Quantity, badges, unavailability — from merged line + article decorators
  const quantity = extractQuantity(effectiveDecorators);
  const badges = mapDecoratorsToBadges(effectiveDecorators);
  const unavailable = extractUnavailableInfo(effectiveDecorators);

  return {
    id: lineId,
    productId,
    name,
    unitQuantity,
    imageId,
    displayPrice,
    originalPrice,
    quantity,
    badges,
    isUnavailable: unavailable.isUnavailable,
    unavailableExplanation: unavailable.unavailableExplanation,
    replacements: unavailable.replacements,
  };
}

// ─── Main transformer ─────────────────────────────────────────────────────────

/**
 * Transform the raw unknown cart response into a CartData display type.
 * All field access is defensive — uses optional chaining and fallback defaults.
 */
export function parseCartResponse(rawData: unknown): CartData {
  if (!isObject(rawData)) {
    return emptyCartData();
  }

  // Merge decorator_overrides into items before processing
  const overridesMap: Record<string, unknown> = isObject(rawData["decorator_overrides"])
    ? (rawData["decorator_overrides"] as Record<string, unknown>)
    : {};

  const rawItems = applyDecoratorOverrides(asArray(rawData["items"]), overridesMap);

  // Map order lines to CartItems
  const items: CartItem[] = rawItems
    .map(mapOrderLineToCartItem)
    .filter((item): item is CartItem => item !== null);

  // Move unavailable items to the bottom while preserving relative order
  items.sort((a, b) => {
    if (a.isUnavailable === b.isUnavailable) return 0;
    return a.isUnavailable ? 1 : -1;
  });

  // Totals
  const totalPrice = asNumber(rawData["checkout_total_price"]);
  const totalCount = asNumber(rawData["total_count"]);
  const membershipSavings = asNumber(rawData["membership_savings"]);

  // Calculate total discount: sum of (price - effectiveDisplayPrice) per line.
  // The line scalar display_price may not reflect a PRICE decorator discount,
  // so we replicate the same fallback used in mapOrderLineToCartItem.
  let totalDiscount = 0;
  for (const rawLine of rawItems) {
    if (!isObject(rawLine)) continue;
    const price = asNumber(rawLine["price"]);
    let effectiveDisplayPrice = asNumber(rawLine["display_price"]);

    // Check line decorators for a PRICE decorator with a corrected display_price
    const lineDecs = getDecorators(rawLine);
    const articleDecs = asArray(rawLine["items"])
      .filter(isObject)
      .flatMap((a) => getDecorators(a));
    const allDecs = mergeOverrides(articleDecs, lineDecs);
    const priceDec = allDecs.find((d) => asString(d["type"]) === "PRICE");
    if (priceDec && typeof priceDec["display_price"] === "number") {
      effectiveDisplayPrice = priceDec["display_price"] as number;
    }

    if (price > effectiveDisplayPrice) {
      totalDiscount += price - effectiveDisplayPrice;
    }
  }

  // Deposit breakdown
  const depositBreakdown = mapDepositBreakdown(rawData["deposit_breakdown"]);
  const depositTotal = depositBreakdown.reduce((sum, e) => sum + e.total, 0);

  // Minimum order value
  const minimumOrderValue = extractMinimumOrderValue(rawData);

  // Suggestions
  const suggestions = extractSuggestions(rawData);

  return {
    items,
    totalPrice,
    totalCount,
    totalDiscount,
    depositTotal,
    depositBreakdown,
    membershipSavings,
    minimumOrderValue,
    suggestions,
  };
}

function emptyCartData(): CartData {
  return {
    items: [],
    totalPrice: 0,
    totalCount: 0,
    totalDiscount: 0,
    depositTotal: 0,
    depositBreakdown: [],
    membershipSavings: 0,
    minimumOrderValue: null,
    suggestions: [],
  };
}
