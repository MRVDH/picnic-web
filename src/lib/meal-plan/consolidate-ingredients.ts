import type { MealPlanShoppingItem, RecipeDetail } from "@/lib/core/types";

type IngredientGroup = {
  ingredientId: string;
  ownerSellingUnitId: string;
  name: string;
  imageId: string | null;
  /** ceil(sum of every recipe's own fractional quantity) — what you'd actually buy. */
  packagesNeeded: number;
  /** sum of each recipe's own ceil(quantity) — what you'd buy shopping recipe-by-recipe. */
  individualPackages: number;
  unitPriceCents: number;
  ownerRecipeId: string;
  usedInRecipeIds: string[];
};

/**
 * Group every non-condiment ingredient across `recipes` by ingredient id
 * (falling back to the selling-unit id, matching parseRecipeDetail's own
 * dedup convention), computing the real packages-needed vs. packages you'd
 * buy shopping each recipe separately.
 *
 * The "owner" of a group is the recipe needing the largest individual share
 * — its own selling_unit_id is what actually gets added to cart (see
 * ShoppingListModal in Task 11); other recipes sharing the ingredient omit
 * it from their own cart call, so it's bought exactly once.
 */
function buildIngredientGroups(recipes: RecipeDetail[]): IngredientGroup[] {
  type Entry = {
    ingredientId: string;
    name: string;
    imageId: string | null;
    rawTotal: number;
    individualPackages: number;
    ownerRecipeId: string;
    ownerSellingUnitId: string;
    ownerQuantity: number;
    ownerUnitPriceCents: number;
    usedInRecipeIds: string[];
  };
  const groups = new Map<string, Entry>();

  for (const recipe of recipes) {
    const seenInRecipe = new Set<string>();
    for (const ing of recipe.ingredients) {
      if (ing.isCondiment) continue;
      const key = ing.ingredientId ?? ing.id;
      if (seenInRecipe.has(key)) continue;
      seenInRecipe.add(key);

      const individual = Math.max(1, Math.ceil(ing.quantity));
      const existing = groups.get(key);
      if (existing) {
        existing.rawTotal += ing.quantity;
        existing.individualPackages += individual;
        existing.usedInRecipeIds.push(recipe.id);
        if (ing.quantity > existing.ownerQuantity) {
          existing.ownerRecipeId = recipe.id;
          existing.ownerSellingUnitId = ing.id;
          existing.ownerQuantity = ing.quantity;
          existing.ownerUnitPriceCents = ing.displayPrice;
        }
      } else {
        groups.set(key, {
          ingredientId: key,
          name: ing.name,
          imageId: ing.imageId,
          rawTotal: ing.quantity,
          individualPackages: individual,
          ownerRecipeId: recipe.id,
          ownerSellingUnitId: ing.id,
          ownerQuantity: ing.quantity,
          ownerUnitPriceCents: ing.displayPrice,
          usedInRecipeIds: [recipe.id],
        });
      }
    }
  }

  return Array.from(groups.values()).map((e) => ({
    ingredientId: e.ingredientId,
    ownerSellingUnitId: e.ownerSellingUnitId,
    name: e.name,
    imageId: e.imageId,
    packagesNeeded: Math.max(1, Math.ceil(e.rawTotal)),
    individualPackages: e.individualPackages,
    unitPriceCents: e.ownerUnitPriceCents,
    ownerRecipeId: e.ownerRecipeId,
    usedInRecipeIds: e.usedInRecipeIds,
  }));
}

/**
 * Cheap score for the combination search: total packages saved and a
 * best-effort total price. Called many times per search, so it only builds
 * what scoring needs.
 */
export function scoreCombination(recipes: RecipeDetail[]): {
  packagesSaved: number;
  totalPriceCents: number;
} {
  const groups = buildIngredientGroups(recipes);
  let packagesSaved = 0;
  let totalPriceCents = 0;
  for (const g of groups) {
    packagesSaved += Math.max(0, g.individualPackages - g.packagesNeeded);
    totalPriceCents += g.packagesNeeded * g.unitPriceCents;
  }
  return { packagesSaved, totalPriceCents };
}

/**
 * Full consolidated shopping list for display: one line per ingredient
 * (shared or not), called once for the chosen plan.
 */
export function consolidateForDisplay(recipes: RecipeDetail[]): {
  items: MealPlanShoppingItem[];
  packagesSaved: number;
  totalPriceCents: number;
} {
  const groups = buildIngredientGroups(recipes);
  const items: MealPlanShoppingItem[] = groups.map((g) => ({
    ingredientId: g.ingredientId,
    ownerSellingUnitId: g.ownerSellingUnitId,
    name: g.name,
    imageId: g.imageId,
    packagesNeeded: g.packagesNeeded,
    unitPriceCents: g.unitPriceCents,
    ownerRecipeId: g.ownerRecipeId,
    usedInRecipeIds: g.usedInRecipeIds,
  }));
  const packagesSaved = groups.reduce(
    (sum, g) => sum + Math.max(0, g.individualPackages - g.packagesNeeded),
    0
  );
  const totalPriceCents = groups.reduce((sum, g) => sum + g.packagesNeeded * g.unitPriceCents, 0);
  return { items, packagesSaved, totalPriceCents };
}
