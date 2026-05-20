import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { PicnicClientInstance } from "@/lib/picnic-client";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;

type SelectedIngredient = { id: string; count: number };

type RequestBody = {
  portions: number;
  selectedIngredients?: SelectedIngredient[];
};

type SendRequestClient = PicnicClientInstance & {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
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
      const rawClient = client as unknown as SendRequestClient;
      for (const item of body.selectedIngredients) {
        if (item.count <= 0) continue;
        await rawClient.sendRequest(
          "POST",
          "/cart/add_product",
          { product_id: item.id, count: item.count },
          true
        );
      }
    } else {
      // Fallback: add all recipe ingredients via the native recipe endpoint.
      await client.recipe.assignSellingGroupToBasket(id, 0, portions);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to add recipe to cart" }, { status: 502 });
  }
}
