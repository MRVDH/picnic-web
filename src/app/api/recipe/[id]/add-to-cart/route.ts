import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;

type SelectedIngredient = { id: string; count: number; ingredientId?: string | null };

type RequestBody = {
  portions: number;
  selectedIngredients?: SelectedIngredient[];
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: true } | { error: string }>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  if (!RECIPE_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const portions = typeof body.portions === "number" && body.portions > 0 ? body.portions : 2;

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);

    if (Array.isArray(body.selectedIngredients)) {
      // Add only the selected ingredients individually — sequentially to avoid
      // concurrent cart mutation conflicts on the Picnic API side.
      for (const item of body.selectedIngredients) {
        if (item.count <= 0) continue;
        await client.cart.addProductToCart(item.id, item.count, [
          { type: "MEAL_PLAN", day_relative_to_slot: 999, number_of_servings: portions },
          {
            type: "SELLING_GROUP",
            selling_group_id: id,
            selling_group_creator_type: "PIM",
            selling_group_component_id: item.ingredientId ?? null,
            selling_group_component_type: "CORE",
            selling_group_component_swap_type: null,
          },
        ]);
      }
    } else {
      // Fallback: add all recipe ingredients via the native recipe endpoint.
      await client.recipe.addRecipeToCart(id, 0, portions);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to add recipe to cart" }, { status: 502 });
  }
}
