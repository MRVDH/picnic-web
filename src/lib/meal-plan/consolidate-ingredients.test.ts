import { describe, expect, it } from "vitest";

import type { RecipeDetail, RecipeIngredient } from "@/lib/core/types";

import { consolidateForDisplay, scoreCombination } from "./consolidate-ingredients";

function ingredient(overrides: Partial<RecipeIngredient> & { id: string }): RecipeIngredient {
  return {
    ingredientId: `slot-${overrides.id}`,
    name: overrides.id,
    imageId: null,
    displayPrice: 100,
    unitQuantity: "500 g",
    maxCount: 99,
    quantity: 1,
    isCondiment: false,
    recipeQuantityText: null,
    originalPrice: null,
    priceRanges: null,
    ...overrides,
  };
}

function recipe(id: string, ingredients: RecipeIngredient[]): RecipeDetail {
  return {
    id,
    name: id,
    imageId: null,
    cookingTimeMinutes: null,
    portions: 2,
    ingredients,
    steps: [],
    stepsPortionWarning: null,
    recipeNutritionRows: [],
    allergens: { confirmed: [], mayContain: [] },
  } as RecipeDetail;
}

describe("consolidateForDisplay", () => {
  it("buys a shared product once when the recipes' needs fit in one package", () => {
    const { items, packagesSaved, totalPriceCents } = consolidateForDisplay([
      recipe("r1", [ingredient({ id: "mehl", recipeQuantityText: "(125 g benötigt)" })]),
      recipe("r2", [ingredient({ id: "mehl", recipeQuantityText: "(250 g benötigt)" })]),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      ownerSellingUnitId: "mehl",
      packagesNeeded: 1,
      ownerRecipeId: "r2",
      usedInRecipeIds: ["r1", "r2"],
    });
    expect(packagesSaved).toBe(1);
    expect(totalPriceCents).toBe(100);
  });

  it("rounds up once over the summed need, not per recipe", () => {
    const { items } = consolidateForDisplay([
      recipe("r1", [
        ingredient({ id: "milch", unitQuantity: "1 l", recipeQuantityText: "(400 ml benötigt)" }),
      ]),
      recipe("r2", [
        ingredient({ id: "milch", unitQuantity: "1 l", recipeQuantityText: "(400 ml benötigt)" }),
      ]),
      recipe("r3", [
        ingredient({ id: "milch", unitQuantity: "1 l", recipeQuantityText: "(400 ml benötigt)" }),
      ]),
    ]);

    expect(items[0].packagesNeeded).toBe(2);
  });

  it("leaves out condiments", () => {
    const { items } = consolidateForDisplay([
      recipe("r1", [ingredient({ id: "salz", isCondiment: true }), ingredient({ id: "reis" })]),
    ]);

    expect(items.map((item) => item.ownerSellingUnitId)).toEqual(["reis"]);
  });

  it("buys a whole package when the need can't be derived", () => {
    const { items, packagesSaved } = consolidateForDisplay([
      recipe("r1", [ingredient({ id: "salat", recipeQuantityText: "(0.5 Köpfe benötigt)" })]),
      recipe("r2", [ingredient({ id: "salat", recipeQuantityText: "(0.5 Köpfe benötigt)" })]),
    ]);

    expect(items[0].packagesNeeded).toBe(2);
    expect(packagesSaved).toBe(0);
  });
});

describe("scoreCombination", () => {
  it("scores like the displayed list", () => {
    const recipes = [
      recipe("r1", [
        ingredient({ id: "mehl", recipeQuantityText: "(125 g benötigt)", displayPrice: 89 }),
      ]),
      recipe("r2", [
        ingredient({ id: "mehl", recipeQuantityText: "(125 g benötigt)", displayPrice: 89 }),
      ]),
    ];

    expect(scoreCombination(recipes)).toEqual({ packagesSaved: 1, totalPriceCents: 89 });
  });
});
