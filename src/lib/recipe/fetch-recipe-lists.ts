// Recipe lists from picnic-api (the cookbook home, categories, saved recipes), mapped to the web's
// RecipeItem and RecipeCategory.
import type PicnicClient from "picnic-api";

import { mapWithConcurrency } from "@/lib/core/concurrency";
import { RECIPE_PAGE_CONCURRENCY } from "@/lib/core/constants";
import { cachedCall } from "@/lib/core/page-cache";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type { RecipeCategory, RecipeItem } from "@/lib/core/types";

type RecipeSummary = PicnicClient.Types.recipe.RecipeSummary;
type RecipeCategoryLink = PicnicClient.Types.recipe.RecipeCategoryLink;

/** The web's id for the saved recipes list. */
export const SAVED_CATEGORY_ID = "__saved__";

/**
 * The web's id for a category link: `category:<category_id>` or `group:<group_name>`. A group
 * stands for the recipes of its categories.
 */
export const CATEGORY_KEY_RE = /^category:[\w-]{1,80}$|^group:[^/?#]{1,80}$/;

const categoryKey = (link: RecipeCategoryLink): string => `${link.type}:${link.id}`;

function mapRecipe(recipe: RecipeSummary): RecipeItem {
  return {
    id: recipe.id,
    name: recipe.name,
    imageId: recipe.imageId,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
  };
}

/** Each recipe once, in order. */
function uniqueRecipes(recipes: RecipeSummary[]): RecipeItem[] {
  const seen = new Set<string>();
  return recipes.flatMap((recipe) => {
    if (seen.has(recipe.id)) return [];
    seen.add(recipe.id);
    return [mapRecipe(recipe)];
  });
}

/**
 * The cookbook home: the recipes of its rows ("featured") and its categories, as one list in
 * the order the app shows them.
 */
export async function fetchRecipeOverview(
  client: PicnicClientInstance
): Promise<{ recipes: RecipeItem[]; categories: RecipeCategory[] }> {
  const overview = await cachedCall(client, "recipes:overview", () =>
    client.recipe.getRecipeOverview()
  );
  const links = overview.categorySections.flatMap((section) => section.categories);
  const seen = new Set<string>();
  return {
    recipes: uniqueRecipes(overview.sections.flatMap((section) => section.recipes)),
    categories: links.flatMap((link) => {
      const id = categoryKey(link);
      if (seen.has(id)) return [];
      seen.add(id);
      return [{ id, name: link.name }];
    }),
  };
}

export async function fetchSavedRecipes(client: PicnicClientInstance): Promise<RecipeItem[]> {
  return (await client.recipe.getSavedRecipes()).map(mapRecipe);
}

function fetchCategory(client: PicnicClientInstance, categoryId: string): Promise<RecipeSummary[]> {
  return cachedCall(client, `recipes:category:${categoryId}`, () =>
    client.recipe.getRecipeCategory(categoryId).then((category) => category.recipes)
  );
}

/**
 * The recipes of a category, or of all categories of a group, fetched `concurrency` at a time.
 * `key` matches CATEGORY_KEY_RE.
 */
export async function fetchCategoryRecipes(
  client: PicnicClientInstance,
  key: string,
  concurrency: number = RECIPE_PAGE_CONCURRENCY
): Promise<RecipeItem[]> {
  const separator = key.indexOf(":");
  const type = key.slice(0, separator);
  const id = key.slice(separator + 1);
  if (type === "category") return uniqueRecipes(await fetchCategory(client, id));

  const group = await cachedCall(client, `recipes:group:${id}`, () =>
    client.recipe.getRecipeCategoryGroup(id)
  );
  const categories = group.categories.filter((link) => link.type === "category");
  const lists = await mapWithConcurrency(
    categories,
    (link) => fetchCategory(client, link.id),
    concurrency
  );
  return uniqueRecipes(lists.flat());
}
