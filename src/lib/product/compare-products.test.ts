import { describe, expect, it } from "vitest";

import type { ComparisonPrice, NutritionRow } from "@/lib/core/types";
import {
  cheapestPerUnitIndex,
  compareNutrition,
  nutritionHeadings,
} from "@/lib/product/compare-products";

const row = (label: string, value: string | null, isCategory = true): NutritionRow => ({
  label,
  value,
  isCategory,
  backgroundColor: null,
});

describe("compareNutrition", () => {
  it("joins the rows by label and leaves a gap where a product has no value", () => {
    const products = [
      { nutritionRows: [row("Per 100 g", null), row("Energie", "250 kJ"), row("Vet", "1 g")] },
      {
        nutritionRows: [
          row("Per 100 ml", null),
          row("Energie", "200 kJ"),
          row("Suikers", "4 g", false),
        ],
      },
    ];

    expect(compareNutrition(products)).toEqual([
      { label: "Energie", isCategory: true, values: ["250 kJ", "200 kJ"] },
      { label: "Vet", isCategory: true, values: ["1 g", null] },
      { label: "Suikers", isCategory: false, values: [null, "4 g"] },
    ]);
    expect(nutritionHeadings(products)).toEqual(["Per 100 g", "Per 100 ml"]);
  });
});

describe("cheapestPerUnitIndex", () => {
  const price = (unit: ComparisonPrice["unit"], cents: number) => ({
    comparisonPrice: { unit, price: cents, lowestPrice: null },
  });

  it("picks the lowest price in the unit most products share", () => {
    expect(cheapestPerUnitIndex([price("kg", 900), price("piece", 10), price("kg", 700)])).toBe(2);
  });

  it("returns null when no two products share a unit", () => {
    expect(cheapestPerUnitIndex([price("kg", 900), price("l", 100)])).toBeNull();
    expect(cheapestPerUnitIndex([price("kg", 900), { comparisonPrice: null }])).toBeNull();
  });
});
