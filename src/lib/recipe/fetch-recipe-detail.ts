import { cachedCall } from "@/lib/core/page-cache";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type { RecipeDetail } from "@/lib/core/types";
import { mapRecipeDetails } from "@/lib/recipe/map-recipe-details";

/**
 * Fetch and parse a recipe with picnic-api's recipe.getRecipe: steps, nutrition, allergens and
 * the ingredients with their products and prices. Without `portions` it uses the count Picnic
 * renders the recipe with. An ingredient whose tile has no name costs a product page request.
 * Recent results are reused (see page-cache), so the meal-plan search and the shopping list
 * share their requests.
 */
export function fetchRecipeDetail(
  client: PicnicClientInstance,
  id: string,
  portions?: number
): Promise<RecipeDetail> {
  return cachedCall(client, `recipe:${id}:${portions ?? ""}`, () =>
    client.recipe.getRecipe(id, { portions, resolveIngredientNames: true }).then(mapRecipeDetails)
  );
}
