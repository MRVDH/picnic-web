import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { extractProductNutritionRows, extractProductTileData } from "@/lib/parse-fusion-product";
import { parseRecipeDetail } from "@/lib/parse-recipe-detail";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { PicnicClientInstance } from "@/lib/picnic-client";
import type { RecipeDetailApiResponse, RecipeIngredient } from "@/lib/types";

type SendRequestClient = PicnicClientInstance & {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;

async function fetchRecipePage(
  client: PicnicClientInstance,
  countryCode: string,
  id: string,
  portions?: number
): Promise<unknown> {
  const portionsParam = portions ? `&portions=${portions}` : "";
  if (countryCode === "DE") {
    return (client as unknown as SendRequestClient).sendRequest(
      "GET",
      `/pages/selling-group-details-page?selling_group_id=${encodeURIComponent(id)}${portionsParam}`,
      null,
      true
    );
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RecipeDetailApiResponse | { error: string }>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  if (!RECIPE_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);
    const portionsParam = request.nextUrl.searchParams.get("portions");
    const portions = portionsParam ? parseInt(portionsParam, 10) : undefined;
    const rawPage = await fetchRecipePage(client, countryCode, id, portions && portions > 0 ? portions : undefined);
    const detail = parseRecipeDetail(rawPage, id);
    const ingredients = await enrichIngredients(
      client as unknown as SendRequestClient,
      detail.ingredients
    );
    return NextResponse.json({ ...detail, ingredients });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load recipe" }, { status: 502 });
  }
}
