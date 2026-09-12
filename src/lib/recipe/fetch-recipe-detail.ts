import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type { RecipeDetail, RecipeIngredient } from "@/lib/core/types";
import {
  extractProductNutritionRows,
  extractProductTileData,
} from "@/lib/product/parse-fusion-product";
import { parseRecipeDetail } from "@/lib/recipe/parse-recipe-detail";

type SendRequestClient = PicnicClientInstance & {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

/**
 * Fetch a recipe's raw Fusion page. Tries selling-group-details-page first
 * (works for DE; NL may use either endpoint), falling back to
 * recipe-details-page-root.
 */
export async function fetchRecipePage(
  client: PicnicClientInstance,
  id: string,
  portions?: number
): Promise<unknown> {
  const portionsParam = portions ? `&portions=${portions}` : "";

  try {
    return await (client as unknown as SendRequestClient).sendRequest(
      "GET",
      `/pages/selling-group-details-page?selling_group_id=${encodeURIComponent(id)}${portionsParam}`,
      null,
      true
    );
  } catch {
    // Fall through to the alternative endpoint
  }

  return (client as unknown as SendRequestClient).sendRequest(
    "GET",
    `/pages/recipe-details-page-root?recipe_id=${encodeURIComponent(id)}${portionsParam}`,
    null,
    true
  );
}

/** Fetch product detail pages in parallel to enrich ingredient stubs with real data. */
async function enrichIngredients(
  client: SendRequestClient,
  ingredients: RecipeIngredient[]
): Promise<RecipeIngredient[]> {
  const uniqueIds = [...new Set(ingredients.map((i) => i.id))];

  type TileEntry = ReturnType<typeof extractProductTileData> & {
    nutritionRows: ReturnType<typeof extractProductNutritionRows>;
  };
  const tileMap = new Map<string, TileEntry>();

  await Promise.all(
    uniqueIds.map(async (unitId) => {
      try {
        const rawPage = await client.sendRequest(
          "GET",
          `/pages/product-details-page-root?id=${encodeURIComponent(unitId)}`,
          null,
          true
        );
        const tile = extractProductTileData(rawPage, unitId);
        const nutritionRows = extractProductNutritionRows(rawPage);
        if (tile.name) tileMap.set(unitId, { ...tile, nutritionRows });
      } catch {
        // leave as stub
      }
    })
  );

  return ingredients.map((ing) => {
    const data = tileMap.get(ing.id);
    if (!data) return ing;
    return {
      ...ing,
      // Keep the recipe-page tile name (short display name); fall back to product page name
      name: ing.name || data.name,
      imageId: data.imageId || ing.imageId,
      displayPrice: data.displayPrice ?? ing.displayPrice,
      unitQuantity: data.unitQuantity || ing.unitQuantity,
      maxCount: data.maxCount || ing.maxCount,
      nutritionRows: data.nutritionRows,
      originalPrice: data.originalPrice,
      priceRanges: data.priceRanges,
    };
  });
}

/**
 * Fetch and fully parse a recipe: raw page + per-ingredient product
 * enrichment (name/price/image/nutrition backfill). Used by the recipe
 * detail route and the meal-plan shopping-list route.
 */
export async function fetchRecipeDetail(
  client: PicnicClientInstance,
  id: string,
  portions?: number
): Promise<RecipeDetail> {
  const rawPage = await fetchRecipePage(client, id, portions);
  const detail = parseRecipeDetail(rawPage, id);
  const ingredients = await enrichIngredients(
    client as unknown as SendRequestClient,
    detail.ingredients
  );
  return { ...detail, ingredients };
}
