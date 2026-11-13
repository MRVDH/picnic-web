// Lines up the details of several products for the comparison table.
import type { NutritionRow, ProductDetail } from "@/lib/core/types";

/** A nutrition row across products: the value of each product, or null when it has none. */
export type ComparedNutritionRow = {
  label: string;
  isCategory: boolean;
  /** Whether less or more is better, as picnic-api reads it from the label. */
  preference: NutritionRow["preference"];
  values: (string | null)[];
  /** The numbers of `values`, to find the better one. */
  amounts: (number | null)[];
};

/**
 * Joins the nutrition tables of the products by row label, in the order the
 * rows first appear. Heading rows ("Per 100 g") are left out: their text is
 * the column header, and products can differ in it.
 */
export function compareNutrition(
  products: Pick<ProductDetail, "nutritionRows">[]
): ComparedNutritionRow[] {
  const rows = new Map<string, ComparedNutritionRow>();

  products.forEach((product, index) => {
    for (const row of product.nutritionRows) {
      if (row.value === null) continue;
      const key = rowKey(row);
      const compared = rows.get(key) ?? {
        label: row.label,
        isCategory: row.isCategory,
        preference: row.preference,
        values: products.map(() => null),
        amounts: products.map(() => null),
      };
      if (compared.values[index] === null) {
        compared.values[index] = row.value;
        compared.amounts[index] = row.amount;
      }
      rows.set(key, compared);
    }
  });

  return [...rows.values()];
}

/** The heading of each product's nutrition table, e.g. "Per 100 g", or null. */
export function nutritionHeadings(
  products: Pick<ProductDetail, "nutritionRows">[]
): (string | null)[] {
  return products.map(
    (product) => product.nutritionRows.find((row) => row.value === null)?.label ?? null
  );
}

/**
 * The index of the product with the lowest price per unit, among the products
 * in the unit most of them share. Null when no two products share a unit
 * (kg against pieces can't be compared).
 */
export function cheapestPerUnitIndex(
  products: Pick<ProductDetail, "comparisonPrice">[]
): number | null {
  const counts = new Map<string, number>();
  for (const product of products) {
    const unit = product.comparisonPrice?.unit;
    if (unit) counts.set(unit, (counts.get(unit) ?? 0) + 1);
  }
  const [unit, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  if (!unit || count < 2) return null;

  let best: number | null = null;
  products.forEach((product, index) => {
    const price = product.comparisonPrice;
    if (price?.unit !== unit) return;
    if (best === null || price.price < products[best].comparisonPrice!.price) best = index;
  });
  return best;
}

function rowKey(row: NutritionRow): string {
  return row.label.trim().toLowerCase();
}

/**
 * The columns with the best value: the lowest or highest number. Empty when
 * fewer than two columns have a value, or when they are all the same, so a
 * row only lights up when it tells the products apart.
 */
export function bestIndexes(
  values: (number | null)[],
  preference: "lower" | "higher"
): Set<number> {
  const known = values.flatMap((value, index) => (value === null ? [] : [{ value, index }]));
  if (known.length < 2) return new Set();
  const numbers = known.map(({ value }) => value);
  const best = preference === "lower" ? Math.min(...numbers) : Math.max(...numbers);
  if (numbers.every((value) => value === best)) return new Set();
  return new Set(known.filter(({ value }) => value === best).map(({ index }) => index));
}
