import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { extractProductTileData } from "@/lib/parse-fusion-product";
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
  id: string
): Promise<unknown> {
  // DE uses selling-group-details-page; NL uses recipe-details-page-root
  if (countryCode === "DE") {
    return (client as unknown as SendRequestClient).sendRequest(
      "GET",
      `/pages/selling-group-details-page?selling_group_id=${encodeURIComponent(id)}`,
      null,
      true
    );
  }
  return client.recipe.getRecipeDetailsPage(id);
}

async function enrichIngredients(
  client: SendRequestClient,
  ingredients: RecipeIngredient[]
): Promise<RecipeIngredient[]> {
  const uniqueIds = [...new Set(ingredients.map((i) => i.id))];

  const tileMap = new Map<string, { name: string; unitQuantity: string; imageId: string; displayPrice: number; maxCount: number }>();

  await Promise.all(
    uniqueIds.map(async (unitId) => {
      try {
        const rawPage = await client.sendRequest(
          "GET",
          `/pages/product-details-page-root?id=${encodeURIComponent(unitId)}`,
          null,
          true
        );
        const data = extractProductTileData(rawPage, unitId);
        if (data.name) tileMap.set(unitId, data);
      } catch {
        // leave ingredient as stub
      }
    })
  );

  return ingredients.map((ing) => {
    const data = tileMap.get(ing.id);
    if (!data) return ing;
    return {
      ...ing,
      name: data.name || ing.name,
      imageId: data.imageId || ing.imageId,
      displayPrice: data.displayPrice ?? ing.displayPrice,
      unitQuantity: data.unitQuantity || ing.unitQuantity,
      maxCount: data.maxCount || ing.maxCount,
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
    const rawPage = await fetchRecipePage(client, countryCode, id);
    const detail = parseRecipeDetail(rawPage, id);

    const enrichedIngredients = await enrichIngredients(
      client as unknown as SendRequestClient,
      detail.ingredients
    );

    return NextResponse.json({ ...detail, ingredients: enrichedIngredients });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load recipe" }, { status: 502 });
  }
}
