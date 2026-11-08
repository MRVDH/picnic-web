import type PicnicClient from "picnic-api";
import { describe, expect, it } from "vitest";

import { mapRecipeDetails } from "./map-recipe-details";

type Recipe = PicnicClient.Types.recipe.Recipe;
type Ingredient = PicnicClient.Types.recipe.RecipeIngredient;

function ingredient(overrides: Partial<Ingredient> & { ingredientId: string }): Ingredient {
  return {
    name: "Zutat",
    sellingUnitId: `s-${overrides.ingredientId}`,
    quantity: 1,
    status: "ACTIVE",
    swapType: null,
    checked: true,
    type: "CORE",
    isAvailable: true,
    unavailableReason: null,
    brand: null,
    imageId: null,
    unitQuantity: "500 g",
    neededText: "(125 g benötigt)",
    price: 199,
    originalPrice: null,
    priceRanges: null,
    promotionLabel: null,
    allergens: { contains: [], mayContain: [] },
    ...overrides,
  };
}

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "a".repeat(24),
    name: "Gemüselasagne",
    imageType: null,
    portions: 2,
    defaultPortions: 2,
    displayedPortions: 2,
    creatorType: "PIM",
    isRecipeOwner: false,
    isSaved: false,
    imageId: "recipes/abc",
    ingredients: [],
    note: null,
    tag: null,
    description: null,
    times: [],
    cookingTimeMinutes: 45,
    steps: ["Ofen vorheizen."],
    stepsPortions: 2,
    stepsWarning: null,
    nutritionRows: [],
    allergens: { contains: ["Gluten"], mayContain: ["Sellerie"] },
    ...overrides,
  } as Recipe;
}

describe("mapRecipeDetails", () => {
  it("keeps only active, orderable ingredients, one product per ingredient", () => {
    const detail = mapRecipeDetails(
      recipe({
        ingredients: [
          ingredient({ ingredientId: "i1", sellingUnitId: "s1", name: "Nudeln" }),
          ingredient({ ingredientId: "i1", sellingUnitId: "s1-multipack", name: "Nudeln 3er" }),
          ingredient({ ingredientId: "i2", status: "UNAVAILABLE" }),
          ingredient({ ingredientId: "i3", sellingUnitId: "" }),
          ingredient({ ingredientId: "i4", sellingUnitId: "s4", name: "Tomaten" }),
        ],
      })
    );

    expect(detail.ingredients.map((i) => [i.ingredientId, i.id, i.name])).toEqual([
      ["i1", "s1", "Nudeln"],
      ["i4", "s4", "Tomaten"],
    ]);
  });

  it("marks unchecked ingredients as condiments and maps prices and tiers", () => {
    const [salt, pasta] = mapRecipeDetails(
      recipe({
        ingredients: [
          ingredient({ ingredientId: "salz", checked: false, price: null }),
          ingredient({
            ingredientId: "nudeln",
            price: 179,
            originalPrice: 229,
            priceRanges: [{ from_quantity: 2, price: 149 }] as Ingredient["priceRanges"],
          }),
        ],
      })
    ).ingredients;

    expect(salt).toMatchObject({ isCondiment: true, displayPrice: 0 });
    expect(pasta).toMatchObject({
      isCondiment: false,
      displayPrice: 179,
      originalPrice: 229,
      priceRanges: [{ quantity: 2, pricePerUnit: 149 }],
      recipeQuantityText: "(125 g benötigt)",
      unitQuantity: "500 g",
    });
  });

  it("falls back to the id for a recipe without a name", () => {
    expect(mapRecipeDetails(recipe({ name: "" })).name).toBe("a".repeat(24));
  });

  it("splits the allergens into confirmed and may-contain", () => {
    const { allergens } = mapRecipeDetails(recipe());

    expect(allergens.confirmed.map((a) => a.text)).toEqual(["Gluten"]);
    expect(allergens.mayContain.map((a) => a.text)).toEqual(["Sellerie"]);
  });
});
