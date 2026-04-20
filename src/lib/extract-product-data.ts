// Extraction helpers for bundle options, similar products, pricing, and
// promotion data from the Fusion product detail page tree.

import type { BundleOption, SliderProduct, ProductPromotion } from "./types";
import {
  PRODUCT_MAIN_CONTAINER_ID,
  PRODUCT_BUNDLES_PREFIX,
  PRODUCT_ALTERNATIVES_ID,
} from "./types";
import {
  findNodeById,
  findNodeByIdPrefix,
  collectPropertyValues,
} from "./pml-helpers";
import type { PmlNode } from "./pml-helpers";

// ─── Selling unit helpers ────────────────────────────────────────────────────

/** Find the main selling unit for a product ID from the page tree. */
export function findMainSellingUnit(
  page: unknown,
  productId: string,
): { displayPrice: number; maxCount: number; imageId: string } {
  const allUnits = collectPropertyValues(page, "sellingUnit").filter(
    (u): u is Record<string, unknown> => typeof u === "object" && u !== null,
  );

  const mainUnit = allUnits.find(
    (u) => u.id === productId && u.max_count !== undefined,
  );

  return {
    displayPrice: (mainUnit?.display_price as number) ?? 0,
    maxCount: (mainUnit?.max_count as number) ?? 99,
    imageId: (mainUnit?.image_id as string) ?? "",
  };
}

/**
 * Resolve the display price with a 3-tier fallback:
 * 1. mainUnit.display_price
 * 2. Price from a bundle node matching the product ID
 * 3. Price from the main container
 */
export function resolveDisplayPrice(
  page: unknown,
  productId: string,
  mainUnitPrice: number,
): number {
  if (mainUnitPrice) return mainUnitPrice;

  // Fallback 2: price from a node with id === productId
  const bundleNode = findNodeById(page, productId);
  if (bundleNode) {
    const prices = collectPropertyValues(bundleNode, "price").filter(
      (p): p is number => typeof p === "number",
    );
    if (prices[0]) return prices[0];
  }

  // Fallback 3: price from the main container
  const mainContainer = findNodeById(page, PRODUCT_MAIN_CONTAINER_ID);
  if (mainContainer) {
    const prices = collectPropertyValues(mainContainer, "price").filter(
      (p): p is number => typeof p === "number",
    );
    if (prices[0]) return prices[0];
  }

  return 0;
}

// ─── Promotion ───────────────────────────────────────────────────────────────

/** Extract promotion data from the entire page tree. */
export function extractPromotion(page: unknown): ProductPromotion | null {
  const promoIds = collectPropertyValues(page, "promotion_id");
  const promoLabels = collectPropertyValues(page, "promotion_label");

  if (promoIds.length === 0 || promoLabels.length === 0) return null;

  const id = promoIds[0];
  const label = promoLabels[0];
  if (typeof id !== "string" || typeof label !== "string") return null;

  return { id, label };
}

// ─── Bundles ─────────────────────────────────────────────────────────────────

/** Find STATE_BOUNDARY nodes with selling-unit-style IDs inside a container. */
function findStateBoundarySellingUnits(container: unknown): PmlNode[] {
  const results: PmlNode[] = [];
  if (typeof container !== "object" || container === null) return results;

  if (Array.isArray(container)) {
    for (const item of container) {
      results.push(...findStateBoundarySellingUnits(item));
    }
    return results;
  }

  const record = container as PmlNode;
  if (
    record.type === "STATE_BOUNDARY" &&
    typeof record.id === "string" &&
    record.id.startsWith("s")
  ) {
    results.push(record);
  }

  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      results.push(...findStateBoundarySellingUnits(value));
    }
  }

  return results;
}

/** Extract bundle options from the page tree.
 *
 * The API embeds bundle pricing as expression props (`__ep1`) containing
 * `{ price, from_quantity }` tier arrays. We recursively search for these
 * props and extract the longest tier list found — which represents the
 * product's progressive discount tiers (e.g. "Vanaf 1 → €1.19, Vanaf 2 → €1.17").
 *
 * Falls back to the legacy `product-page-bundles-*` container approach.
 */
export function extractBundles(page: unknown): BundleOption[] {
  // Strategy 1: find __ep1.v1 tier arrays in expression props
  const tiers = findBundleTiers(page);
  if (tiers.length > 0) {
    return tiers.map((tier) => ({
      id: "",
      quantity: tier.from_quantity,
      pricePerUnit: tier.price,
      imageId: "",
      maxCount: 0,
    }));
  }

  // Strategy 2 (legacy): structured selling units under product-page-bundles-*
  const bundleContainer = findNodeByIdPrefix(page, PRODUCT_BUNDLES_PREFIX);
  if (!bundleContainer) return [];

  const bundleItemNodes = findStateBoundarySellingUnits(bundleContainer);
  const bundles: BundleOption[] = [];

  for (let i = 0; i < bundleItemNodes.length; i++) {
    const node = bundleItemNodes[i];
    const sellingUnits = collectPropertyValues(node, "sellingUnit").filter(
      (u): u is Record<string, unknown> => typeof u === "object" && u !== null,
    );
    const prices = collectPropertyValues(node, "price").filter(
      (p): p is number => typeof p === "number",
    );
    const su = sellingUnits[0];
    if (!su) continue;

    bundles.push({
      id: (su.id as string) ?? "",
      quantity: i + 1,
      pricePerUnit: prices[0] ?? 0,
      imageId: (su.image_id as string) ?? "",
      maxCount: (su.max_count as number) ?? 0,
    });
  }

  return bundles;
}

type BundleTier = { price: number; from_quantity: number };

/** Recursively search for __ep1.v1 arrays containing bundle tier data. */
function findBundleTiers(obj: unknown): BundleTier[] {
  if (typeof obj !== "object" || obj === null) return [];

  if (Array.isArray(obj)) {
    // Check if this array itself is a tier list
    if (obj.length > 1 && isBundleTier(obj[0])) {
      return obj as BundleTier[];
    }
    for (const item of obj) {
      const result = findBundleTiers(item);
      if (result.length > 0) return result;
    }
    return [];
  }

  const record = obj as Record<string, unknown>;

  // Check __ep1.v1 directly — this is where the API puts bundle tiers
  const ep1 = record["__ep1"];
  if (typeof ep1 === "object" && ep1 !== null && !Array.isArray(ep1)) {
    const v1 = (ep1 as Record<string, unknown>)["v1"];
    if (Array.isArray(v1) && v1.length > 1 && isBundleTier(v1[0])) {
      return v1 as BundleTier[];
    }
  }

  for (const value of Object.values(record)) {
    const result = findBundleTiers(value);
    if (result.length > 0) return result;
  }
  return [];
}

function isBundleTier(obj: unknown): obj is BundleTier {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>)["price"] === "number" &&
    typeof (obj as Record<string, unknown>)["from_quantity"] === "number"
  );
}

// ─── Similar products ────────────────────────────────────────────────────────

/** Extract similar products from the alternatives container. */
export function extractSimilarProducts(page: unknown): SliderProduct[] {
  const altContainer = findNodeById(page, PRODUCT_ALTERNATIVES_ID);
  if (!altContainer) return [];

  const allUnits = collectPropertyValues(altContainer, "sellingUnit").filter(
    (u): u is Record<string, unknown> => typeof u === "object" && u !== null,
  );

  return allUnits
    .filter((u) => u.display_price !== undefined)
    .map((u) => ({
      id: (u.id as string) ?? "",
      name: (u.name as string) ?? "",
      imageId: (u.image_id as string) ?? "",
      displayPrice: (u.display_price as number) ?? 0,
      unitQuantity: (u.unit_quantity as string) ?? "",
      maxCount: (u.max_count as number) ?? 0,
      ...(u.deposit !== undefined ? { deposit: u.deposit as number } : {}),
    }));
}
