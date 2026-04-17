// Parser that extracts Product[] from an L2 category page
// FusionPage PML tree. Reuses shared conversion logic from parse-fusion-search.

import { findSellingUnitContainers } from "@/lib/pml-helpers";
import { containerToProduct } from "@/lib/parse-fusion-search";
import type { Product } from "@/lib/types";

/**
 * Parse an L2 category FusionPage into Product[].
 *
 * L2 pages contain selling-unit tiles (same PML structure as search results).
 * Products are deduplicated by ID (first occurrence wins).
 */
export function parseCategoryProductPage(rawPage: unknown): Product[] {
  const containers = findSellingUnitContainers(rawPage);
  const seenIds = new Set<string>();
  const products: Product[] = [];

  for (const container of containers) {
    const product = containerToProduct(container);
    if (!product) continue;
    if (seenIds.has(product.id)) continue;

    seenIds.add(product.id);
    products.push(product);
  }

  return products;
}
