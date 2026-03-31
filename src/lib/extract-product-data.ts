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
    maxCount: (mainUnit?.max_count as number) ?? 0,
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

/** Extract bundle options from bundle container nodes. */
export function extractBundles(page: unknown): BundleOption[] {
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
