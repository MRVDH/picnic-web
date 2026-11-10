// Recipe lists from picnic-api (the cookbook home, categories, saved recipes), mapped to the web's
// RecipeItem and RecipeCategory.
import type PicnicClient from "picnic-api";

import { mapWithConcurrency } from "@/lib/core/concurrency";
import { RECIPE_PAGE_CONCURRENCY } from "@/lib/core/constants";
import { cachedCall } from "@/lib/core/page-cache";
import { type PicnicClientInstance, getFusionPage } from "@/lib/core/picnic-client";
import type { CountryCode, RecipeCategory, RecipeItem } from "@/lib/core/types";
import { parseRecipeTiles } from "@/lib/recipe/parse-recipe-pages";
import { findRecipeCattreePage } from "@/lib/recipe/recipe-cattree-pages";

type RecipeSummary = PicnicClient.Types.recipe.RecipeSummary;
type RecipeCategoryLink = PicnicClient.Types.recipe.RecipeCategoryLink;

/** The web's id for the saved recipes list. */
export const SAVED_CATEGORY_ID = "__saved__";

/**
 * The web's id for a category link: `category:<category_id>` or `group:<group_name>`, where a
 * group stands for the recipes of its categories, or `legacy:<recipe-cattree page>` for a DE
 * category read from its full recipe-cattree page.
 */
export const CATEGORY_KEY_RE =
  /^category:[\w-]{1,80}$|^group:[^/?#]{1,80}$|^legacy:recipe-cattree-[\w-]{1,60}$/;

function categoryKey(link: RecipeCategoryLink, countryCode: CountryCode): string {
  // Groups keep their own page: the recipe-cattree-l2-* group pages hold no recipe tiles.
  const cattreePage =
    countryCode === "DE" && link.type === "category" ? findRecipeCattreePage(link.name) : null;
  return cattreePage ? `legacy:${cattreePage}` : `${link.type}:${link.id}`;
}

function mapRecipe(recipe: RecipeSummary): RecipeItem {
  return {
    id: recipe.id,
    name: recipe.name,
    imageId: recipe.imageId,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
  };
}

/** Each recipe once, in order. */
function uniqueRecipes(recipes: RecipeItem[]): RecipeItem[] {
  const seen = new Set<string>();
  return recipes.filter((recipe) => !seen.has(recipe.id) && seen.add(recipe.id));
}

/**
 * The cookbook home: the recipes of its rows ("featured") and its categories, as one list in
 * the order the app shows them.
 */
export async function fetchRecipeOverview(
  client: PicnicClientInstance,
  countryCode: CountryCode
): Promise<{ recipes: RecipeItem[]; categories: RecipeCategory[] }> {
  const overview = await cachedCall(client, "recipes:overview", () =>
    client.recipe.getRecipeOverview()
  );
  const links = overview.categorySections.flatMap((section) => section.categories);
  const seen = new Set<string>();
  return {
    recipes: uniqueRecipes(overview.sections.flatMap((section) => section.recipes.map(mapRecipe))),
    categories: links.flatMap((link) => {
      const id = categoryKey(link, countryCode);
      if (seen.has(id)) return [];
      seen.add(id);
      return [{ id, name: link.name }];
    }),
  };
}

export async function fetchSavedRecipes(client: PicnicClientInstance): Promise<RecipeItem[]> {
  return (await client.recipe.getSavedRecipes()).map(mapRecipe);
}

/** The recipes of a category; picnic-api reads the category page in either format. */
function fetchCategory(client: PicnicClientInstance, categoryId: string): Promise<RecipeItem[]> {
  return cachedCall(client, `recipes:category:${categoryId}`, async () => {
    const category = await client.recipe.getRecipeCategory(categoryId);
    return uniqueRecipes(category.recipes.map(mapRecipe));
  });
}

/** The category ids of a group. */
function fetchGroupCategoryIds(client: PicnicClientInstance, groupName: string): Promise<string[]> {
  return cachedCall(client, `recipes:group:${groupName}`, async () => {
    const group = await client.recipe.getRecipeCategoryGroup(groupName);
    return group.categories.filter((link) => link.type === "category").map((link) => link.id);
  });
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
  if (type === "category") return fetchCategory(client, id);
  if (type === "legacy") {
    return cachedCall(client, `recipes:legacy:${id}`, async () =>
      parseRecipeTiles(await getFusionPage(client, id))
    );
  }

  const categoryIds = await fetchGroupCategoryIds(client, id);
  const lists = await mapWithConcurrency(
    categoryIds,
    (categoryId) => fetchCategory(client, categoryId),
    concurrency
  );
  return uniqueRecipes(lists.flat());
}
