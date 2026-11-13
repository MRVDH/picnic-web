// Orders products by their price per kg, litre or piece, so the cheapest
// option of a product is easy to find. picnic-api computes the comparison price.
import type { ComparisonUnit, Product } from "@/lib/core/types";

export type ComparisonGroup = {
  /** The unit the products are compared in, or null for products without a comparison price. */
  unit: ComparisonUnit | null;
  /** The products, cheapest per unit first. */
  products: Product[];
};

/**
 * Groups products by the unit of their comparison price and sorts each group
 * from cheap to expensive, by the price of one package; unavailable products
 * go to the end of their group. Groups with more products come first;
 * products without a comparison price come last, in their original order.
 * Each product appears once.
 */
export function sortByComparisonPrice(products: Product[]): ComparisonGroup[] {
  const unique = [...new Map(products.map((product) => [product.id, product])).values()];
  const groups = new Map<ComparisonUnit, Product[]>();
  const withoutPrice: Product[] = [];

  for (const product of unique) {
    const unit = product.comparisonPrice?.unit;
    if (!unit) {
      withoutPrice.push(product);
      continue;
    }
    groups.set(unit, [...(groups.get(unit) ?? []), product]);
  }

  const sorted: ComparisonGroup[] = [...groups.entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([unit, group]) => ({
      unit,
      // Products that can't be ordered now go last, so the first one is the cheapest to buy.
      products: [...group].sort(
        (a, b) =>
          Number(a.isUnavailable) - Number(b.isUnavailable) ||
          comparisonValue(a) - comparisonValue(b)
      ),
    }));
  return withoutPrice.length > 0 ? [...sorted, { unit: null, products: withoutPrice }] : sorted;
}

/** Whether a list has enough comparison prices to sort by. */
export function canSortByComparisonPrice(products: Product[]): boolean {
  return products.filter((product) => product.comparisonPrice).length >= 2;
}

/** The price per unit of one package, the price the card shows. */
function comparisonValue(product: Product): number {
  return product.comparisonPrice?.price ?? Number.POSITIVE_INFINITY;
}
