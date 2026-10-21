// Maps picnic-api's recipe details to the web's RecipeDetail, which the recipe page and the meal
// planner use.
import type PicnicClient from "picnic-api";

import type { AllergenInfo, RecipeDetail, RecipeIngredient } from "@/lib/core/types";

type RecipeDetails = PicnicClient.Types.recipe.Recipe;
type RecipeAllergens = PicnicClient.Types.recipe.RecipeAllergens;

/** Ingredient tiles don't carry a max count; the cart API enforces the real limit. */
const DEFAULT_MAX_COUNT = 99;

const ALLERGEN_CONFIRMED_BG = "#fef3c7";
const ALLERGEN_CONFIRMED_TEXT = "#92400e";
const ALLERGEN_MAY_CONTAIN_BG = "#f3f4f6";
const ALLERGEN_MAY_CONTAIN_TEXT = "#4b5563";

function mapAllergens(allergens: RecipeAllergens): AllergenInfo {
  return {
    confirmed: allergens.contains.map((text) => ({
      text,
      backgroundColor: ALLERGEN_CONFIRMED_BG,
      textColor: ALLERGEN_CONFIRMED_TEXT,
    })),
    mayContain: allergens.mayContain.map((text) => ({
      text,
      backgroundColor: ALLERGEN_MAY_CONTAIN_BG,
      textColor: ALLERGEN_MAY_CONTAIN_TEXT,
    })),
  };
}

/**
 * The orderable ingredients, one product each: an ingredient can list more products (a single
 * pack and a multipack); the first is the one the app selects.
 */
function mapIngredients(recipe: RecipeDetails): RecipeIngredient[] {
  const seen = new Set<string>();
  return recipe.ingredients.flatMap((ingredient) => {
    if (ingredient.status !== "ACTIVE" || !ingredient.sellingUnitId) return [];
    if (seen.has(ingredient.ingredientId)) return [];
    seen.add(ingredient.ingredientId);
    return [
      {
        id: ingredient.sellingUnitId,
        ingredientId: ingredient.ingredientId,
        name: ingredient.name ?? "",
        imageId: ingredient.imageId,
        displayPrice: ingredient.price ?? 0,
        unitQuantity: ingredient.unitQuantity ?? "",
        maxCount: DEFAULT_MAX_COUNT,
        quantity: ingredient.quantity,
        isCondiment: !ingredient.checked,
        recipeQuantityText: ingredient.neededText,
        originalPrice: ingredient.originalPrice,
        priceRanges:
          ingredient.priceRanges?.map((tier) => ({
            quantity: tier.from_quantity,
            pricePerUnit: tier.price,
          })) ?? null,
      },
    ];
  });
}

export function mapRecipeDetails(recipe: RecipeDetails): RecipeDetail {
  return {
    id: recipe.id,
    name: recipe.name || recipe.id,
    imageId: recipe.imageId,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    portions: recipe.portions,
    ingredients: mapIngredients(recipe),
    steps: recipe.steps,
    stepsPortionWarning: recipe.stepsWarning,
    recipeNutritionRows: recipe.nutritionRows,
    allergens: mapAllergens(recipe.allergens),
  };
}
