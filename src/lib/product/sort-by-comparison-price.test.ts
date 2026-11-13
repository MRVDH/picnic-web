import { describe, expect, it } from "vitest";

import type { ComparisonPrice, Product } from "@/lib/core/types";
import {
  canSortByComparisonPrice,
  sortByComparisonPrice,
} from "@/lib/product/sort-by-comparison-price";

function product(id: string, comparisonPrice: ComparisonPrice | null): Product {
  return {
    id,
    name: `Product ${id}`,
    namePrefix: null,
    subtitle: null,
    subtitleColor: null,
    subtitleLeadingIcon: null,
    subtitleTrailingIcon: null,
    brand: null,
    highlight: null,
    flagIconKey: null,
    flagFallbackImageId: null,
    imageId: "image",
    displayPrice: 100,
    originalPrice: null,
    displayPriceColor: null,
    unitQuantity: "",
    comparisonPrice,
    maxCount: 99,
    priceRanges: null,
    badges: [],
    promoBadge: null,
    promoPlacement: null,
    isUnavailable: false,
    unavailableReason: null,
  };
}

const perKg = (price: number): ComparisonPrice => ({ unit: "kg", price, lowestPrice: null });

describe("sortByComparisonPrice", () => {
  it("sorts per unit from cheap to expensive, larger groups first, products without a price last", () => {
    const groups = sortByComparisonPrice([
      product("a", perKg(1500)),
      product("b", null),
      product("c", { unit: "piece", price: 40, lowestPrice: null }),
      product("d", perKg(900)),
      product("a", perKg(1500)),
      product("e", perKg(1200)),
    ]);

    expect(groups.map((group) => [group.unit, group.products.map((p) => p.id)])).toEqual([
      ["kg", ["d", "e", "a"]],
      ["piece", ["c"]],
      [null, ["b"]],
    ]);
  });
});

describe("sortByComparisonPrice with unavailable products", () => {
  it("puts them last in their group", () => {
    const unavailable = { ...product("a", perKg(500)), isUnavailable: true };
    const groups = sortByComparisonPrice([unavailable, product("b", perKg(900))]);
    expect(groups[0].products.map((p) => p.id)).toEqual(["b", "a"]);
  });
});

describe("canSortByComparisonPrice", () => {
  it("needs two products with a comparison price", () => {
    expect(canSortByComparisonPrice([product("a", perKg(100)), product("b", null)])).toBe(false);
    expect(canSortByComparisonPrice([product("a", perKg(100)), product("b", perKg(200))])).toBe(
      true
    );
  });
});
