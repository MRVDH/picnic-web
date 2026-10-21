/**
 * Order line transformer for the delivery and wallet pages: applies decorator
 * overrides and maps order lines to CartItems. The cart itself comes from
 * picnic-api (see map-cart.ts).
 */
import { asArray, asNumber, asString, isObject } from "@/lib/core/type-guards";
import type { Badge, CartItem, SliderProduct } from "@/lib/core/types";

// ─── Decorator helpers ────────────────────────────────────────────────────────

type RawDecorator = Record<string, unknown>;

function getDecorators(item: Record<string, unknown>): RawDecorator[] {
  return asArray(item["decorators"]).filter(isObject);
}

/**
 * Merge decorator_overrides into an item's decorators array.
 * Overrides replace matching-type decorators; new types are appended.
 */
function mergeOverrides(decorators: RawDecorator[], overrides: RawDecorator[]): RawDecorator[] {
  if (overrides.length === 0) return decorators;
  const result = [...decorators];
  for (const override of overrides) {
    const overrideType = asString(override["type"]);
    const existingIdx = result.findIndex((d) => asString(d["type"]) === overrideType);
    if (existingIdx >= 0) {
      result[existingIdx] = override;
    } else {
      result.push(override);
    }
  }
  return result;
}

export function applyDecoratorOverrides(
  items: unknown[],
  overridesMap: Record<string, unknown>
): unknown[] {
  return items.map((rawLine) => {
    if (!isObject(rawLine)) return rawLine;

    const lineId = asString(rawLine["id"]);
    const lineOverrides = asArray(overridesMap[lineId]).filter(isObject);
    const mergedLineDecorators = mergeOverrides(getDecorators(rawLine), lineOverrides);

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
        if (!text) break;
        const isBundleLabel = text.toLowerCase().includes("bundel");
        const backgroundColor = asString(dec["background_color"]) || undefined;
        const textColor = asString(dec["text_color"]) || undefined;
        badges.push({
          text,
          variant: isBundleLabel ? "bundle" : "promo",
          backgroundColor,
          textColor,
        });
        break;
      }
      case "FRESH_LABEL": {
        const period = asString(dec["period"]);
        if (period) badges.push({ text: period, variant: "freshness" });
        break;
      }
      case "BASE_PRICE": {
        const basePriceText = asString(dec["base_price_text"]);
        if (basePriceText) badges.push({ text: basePriceText, variant: "unit-price" });
        break;
      }
      case "BUNDLES_BUTTON":
        badges.push({ text: "BundelBonus", variant: "bundle" });
        break;
    }
  }
  return badges;
}

// ─── Quantity extraction ──────────────────────────────────────────────────────

function extractQuantity(decorators: RawDecorator[]): number {
  const quantityDec = decorators.find((d) => asString(d["type"]) === "QUANTITY");
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
  const unavailableDec = decorators.find((d) => asString(d["type"]) === "UNAVAILABLE");

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

// ─── Order line → CartItem ────────────────────────────────────────────────────

export function mapOrderLineToCartItem(rawLine: unknown): CartItem | null {
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

  const priceDec = effectiveDecorators.find((d) => asString(d["type"]) === "PRICE");
  if (priceDec && typeof priceDec["display_price"] === "number") {
    displayPrice = priceDec["display_price"] as number;
  }

  const originalPrice = rawPrice !== displayPrice ? rawPrice : null;

  // Quantity, badges, unavailability — from merged line + article decorators
  const quantity = extractQuantity(effectiveDecorators);
  const badges = mapDecoratorsToBadges(effectiveDecorators);
  const unavailable = extractUnavailableInfo(effectiveDecorators);

  // Recipe / selling-group association from the BASKET_GROUP line decorator
  const basketGroupDec = lineDecorators.find((d) => asString(d["type"]) === "BASKET_GROUP");
  const basketGroupId = basketGroupDec ? asString(basketGroupDec["id"]) || null : null;

  return {
    id: lineId,
    productId,
    name,
    unitQuantity,
    imageId,
    displayPrice,
    originalPrice,
    quantity,
    maxCount: firstArticle ? asNumber(firstArticle["max_count"], 99) : 99,
    badges,
    isUnavailable: unavailable.isUnavailable,
    unavailableExplanation: unavailable.unavailableExplanation,
    replacements: unavailable.replacements,
    basketGroupId,
  };
}
