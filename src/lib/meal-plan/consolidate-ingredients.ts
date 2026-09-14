import { packageFraction } from "@/lib/meal-plan/package-fraction";
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
 * Group every non-condiment ingredient across `recipes` by selling-unit id
 * (the product), computing the real packages-needed vs. packages you'd buy
 * shopping each recipe separately.
 *
 * The "owner" of a group is the recipe needing the largest individual share
 * — its own selling_unit_id is what actually gets added to cart (see
 * ShoppingListModal in Task 11); other recipes sharing the ingredient omit
 * it from their own cart call, so it's bought exactly once.
 */
function buildIngredientGroups(recipes: RecipeDetail[]): IngredientGroup[] {
  type Entry = {
    ownerIngredientId: string | null;
    name: string;
    imageId: string | null;
    rawTotal: number;
    individualPackages: number;
    ownerRecipeId: string;
    ownerSellingUnitId: string;
    ownerNeed: number;
    ownerUnitPriceCents: number;
    usedInRecipeIds: string[];
  };
  const groups = new Map<string, Entry>();

  for (const recipe of recipes) {
    const seenInRecipe = new Set<string>();
    for (const ing of recipe.ingredients) {
      if (ing.isCondiment) continue;
      // Group by product, not by ing.ingredientId: that is a
      // selling_group_component_id, a slot within one recipe, so it never
      // matches across recipes and every group would hold exactly one recipe.
      const key = ing.id;
      if (seenInRecipe.has(key)) continue;
      seenInRecipe.add(key);

      // `quantity` is always 1 from the API; the real fractional need comes
      // from the tile text when its unit compares to the package size.
      const need =
        packageFraction(ing.recipeQuantityText, ing.recipePackageSize, ing.unitQuantity) ??
        ing.quantity;
      const individual = Math.max(1, Math.ceil(need));
      const existing = groups.get(key);
      if (existing) {
        existing.rawTotal += need;
        existing.individualPackages += individual;
        existing.usedInRecipeIds.push(recipe.id);
        if (need > existing.ownerNeed) {
          existing.ownerRecipeId = recipe.id;
          existing.ownerSellingUnitId = ing.id;
          existing.ownerIngredientId = ing.ingredientId;
          existing.ownerNeed = need;
          existing.ownerUnitPriceCents = ing.displayPrice;
        }
      } else {
        groups.set(key, {
          ownerIngredientId: ing.ingredientId,
          name: ing.name,
          imageId: ing.imageId,
          rawTotal: need,
          individualPackages: individual,
          ownerRecipeId: recipe.id,
          ownerSellingUnitId: ing.id,
          ownerNeed: need,
          ownerUnitPriceCents: ing.displayPrice,
          usedInRecipeIds: [recipe.id],
        });
      }
    }
  }

  return Array.from(groups.values()).map((e) => ({
    // The owner's slot id, which its add-to-cart call needs as the
    // selling_group_component_id; falls back to the product id.
    ingredientId: e.ownerIngredientId ?? e.ownerSellingUnitId,
    ownerSellingUnitId: e.ownerSellingUnitId,
    name: e.name,
    imageId: e.imageId,
    // Epsilon absorbs float drift from summing fractional quantities (e.g. 1/3 + 1/3 + 1/3).
    packagesNeeded: Math.max(1, Math.ceil(e.rawTotal - 1e-9)),
    individualPackages: e.individualPackages,
    unitPriceCents: e.ownerUnitPriceCents,
    ownerRecipeId: e.ownerRecipeId,
    usedInRecipeIds: e.usedInRecipeIds,
  }));
}

/**
 * Compute packages saved and total price from ingredient groups.
 * Private helper used by both scoreCombination and consolidateForDisplay
 * to ensure the two stay in sync.
 */
function computeScore(groups: IngredientGroup[]): {
  packagesSaved: number;
  totalPriceCents: number;
} {
  let packagesSaved = 0;
  let totalPriceCents = 0;
  for (const g of groups) {
    packagesSaved += Math.max(0, g.individualPackages - g.packagesNeeded);
    totalPriceCents += g.packagesNeeded * g.unitPriceCents;
  }
  return { packagesSaved, totalPriceCents };
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
  return computeScore(groups);
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
  const { packagesSaved, totalPriceCents } = computeScore(groups);
  return { items, packagesSaved, totalPriceCents };
}
