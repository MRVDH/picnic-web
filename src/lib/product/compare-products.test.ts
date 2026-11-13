import { describe, expect, it } from "vitest";

import type { ComparisonPrice, NutritionRow } from "@/lib/core/types";
import {
  bestIndexes,
  cheapestPerUnitIndex,
  compareNutrition,
  nutritionHeadings,
} from "@/lib/product/compare-products";

/** A row as picnic-api returns it, with the amount and preference it reads. */
const row = (
  label: string,
  value: string | null,
  amount: number | null = null,
  preference: NutritionRow["preference"] = null,
  isCategory = true
): NutritionRow => ({ label, value, isCategory, backgroundColor: null, amount, preference });

describe("compareNutrition", () => {
  it("joins the rows by label and leaves a gap where a product has no value", () => {
    const products = [
      {
        nutritionRows: [
          row("Per 100 g", null),
          row("Energie", "250 kJ", 250, "lower"),
          row("Vet", "1 g", 1, "lower"),
        ],
      },
      {
        nutritionRows: [
          row("Per 100 ml", null),
          row("Energie", "200 kJ", 200, "lower"),
          row("Suikers", "4 g", 4, "lower", false),
        ],
      },
    ];

    expect(compareNutrition(products)).toEqual([
      {
        label: "Energie",
        isCategory: true,
        preference: "lower",
        values: ["250 kJ", "200 kJ"],
        amounts: [250, 200],
      },
      {
        label: "Vet",
        isCategory: true,
        preference: "lower",
        values: ["1 g", null],
        amounts: [1, null],
      },
      {
        label: "Suikers",
        isCategory: false,
        preference: "lower",
        values: [null, "4 g"],
        amounts: [null, 4],
      },
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

describe("bestIndexes", () => {
  it("marks the lowest or highest values, ties included", () => {
    expect(bestIndexes([3, 1, 1, null], "lower")).toEqual(new Set([1, 2]));
    expect(bestIndexes([3, 1, null], "higher")).toEqual(new Set([0]));
  });

  it("marks nothing when the values don't differ or only one is known", () => {
    expect(bestIndexes([2, 2], "lower")).toEqual(new Set());
    expect(bestIndexes([2, null], "lower")).toEqual(new Set());
  });
});
