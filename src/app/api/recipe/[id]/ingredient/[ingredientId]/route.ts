import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { PicnicClientInstance } from "@/lib/core/picnic-client";
import type { IngredientEditApiResponse, IngredientEditData } from "@/lib/core/types";
import { parseIngredientEdit } from "@/lib/recipe/parse-ingredient-edit";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;
/** PIM ingredients are UUIDs; user-defined ones are 32 hex chars without dashes. */
const INGREDIENT_ID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/;

type SendRequestClient = PicnicClientInstance & {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

type SaveBody = { portions: number; quantities: Record<string, number> };

/** Picnic fails to render this page for portions < 1, which is the app bug we fix. */
function clampPortions(value: number | null): number {
  return value !== null && Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

async function fetchEditPage(
  client: SendRequestClient,
  recipeId: string,
  ingredientId: string,
  portions: number
): Promise<unknown> {
  return client.sendRequest(
    "GET",
    `/pages/selling-group-component-edit-page?ingredient_id=${encodeURIComponent(
      ingredientId
    )}&selling_group_id=${encodeURIComponent(recipeId)}&portions=${portions}`,
    null,
    true
  );
}

function validate(
  request: NextRequest,
  id: string,
  ingredientId: string
): { error: NextResponse<{ error: string }> } | { token: string } {
  const token = readAuthToken(request);
  if (!token) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  if (!RECIPE_ID_RE.test(id) || !INGREDIENT_ID_RE.test(ingredientId)) {
    return {
      error: NextResponse.json({ error: "Invalid recipe or ingredient ID" }, { status: 400 }),
    };
  }
  return { token };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ingredientId: string }> }
): Promise<NextResponse<IngredientEditApiResponse | { error: string }>> {
  const { id, ingredientId } = await params;
  const checked = validate(request, id, ingredientId);
  if ("error" in checked) return checked.error;

  try {
    const client = buildPicnicClient(checked.token, readCountryCode(request));
    const portionsParam = request.nextUrl.searchParams.get("portions");
    const portions = clampPortions(portionsParam ? parseInt(portionsParam, 10) : null);
    const rawPage = await fetchEditPage(
      client as unknown as SendRequestClient,
      id,
      ingredientId,
      portions
    );
    return NextResponse.json(parseIngredientEdit(rawPage, ingredientId));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load ingredient alternatives" }, { status: 502 });
  }
}

/**
 * Decide which swap type the save task gets, mirroring the app's own rule:
 * staying inside the ingredient's own variants is a WITHIN swap, picking one of
 * the suggestions below it is a POPULAR_SELECTION, anything else came from search.
 */
function resolveSwapType(
  parsed: IngredientEditData,
  selectedIds: string[]
): "WITHIN_SELLING_GROUP_COMPONENT" | "POPULAR_SELECTION" | "SEARCH_SELECTION" {
  const ownIds = parsed.groups[0]?.alternatives.map((a) => a.id) ?? [];
  const suggestedIds = parsed.groups.slice(1).flatMap((g) => g.alternatives.map((a) => a.id));
  const originalIds = Object.keys(parsed.selected);

  const areSameSellingUnits = selectedIds.every((selectedId) => originalIds.includes(selectedId));
  const isWithinSameComponent =
    areSameSellingUnits || selectedIds.some((selectedId) => ownIds.includes(selectedId));
  if (isWithinSameComponent) return "WITHIN_SELLING_GROUP_COMPONENT";
  return selectedIds.some((selectedId) => suggestedIds.includes(selectedId))
    ? "POPULAR_SELECTION"
    : "SEARCH_SELECTION";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ingredientId: string }> }
): Promise<NextResponse<{ success: true } | { error: string }>> {
  const { id, ingredientId } = await params;
  const checked = validate(request, id, ingredientId);
  if ("error" in checked) return checked.error;

  let body: SaveBody;
  try {
    body = (await request.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof body.quantities !== "object" || body.quantities === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const portions = clampPortions(body.portions);
  const selected: Record<string, number> = {};
  for (const [sellingUnitId, count] of Object.entries(body.quantities)) {
    if (typeof count === "number" && count > 0) selected[sellingUnitId] = Math.floor(count);
  }
  const selectedIds = Object.keys(selected);

  try {
    const client = buildPicnicClient(
      checked.token,
      readCountryCode(request)
    ) as unknown as SendRequestClient;

    // Deselecting everything removes the ingredient from the recipe.
    if (selectedIds.length === 0) {
      await client.sendRequest(
        "POST",
        "/pages/task/delete-selling-group-component",
        { payload: { selling_group_component_id: ingredientId, selling_group_id: id } },
        true
      );
      return NextResponse.json({ success: true });
    }

    // Re-read the page server-side so the swap type is derived from Picnic's own
    // grouping rather than from whatever the client claims.
    const parsed = parseIngredientEdit(
      await fetchEditPage(client, id, ingredientId, portions),
      ingredientId
    );
    const swapType = resolveSwapType(parsed, selectedIds);

    // Mirrors the app: when the selection stays within the units already saved and
    // more than one was saved, every original is explicitly zeroed first.
    const originalIds = Object.keys(parsed.selected);
    const quantityById: Record<string, number> = {};
    if (selectedIds.every((sid) => originalIds.includes(sid)) && originalIds.length > 1) {
      for (const originalId of originalIds) quantityById[originalId] = 0;
    }
    for (const [sellingUnitId, count] of Object.entries(selected)) {
      quantityById[sellingUnitId] = count;
    }

    const saveResult = (await client.sendRequest(
      "POST",
      "/pages/task/save-selling-group-edit-task",
      {
        payload: {
          requested_sellable_portions: String(portions),
          selling_group_component_id: ingredientId,
          selling_group_id: id,
          selling_unit_quantity_by_id: quantityById,
          swapType,
        },
      },
      true
    )) as { shouldUpdateCart?: boolean } | null;

    if (saveResult?.shouldUpdateCart) {
      await client.sendRequest(
        "POST",
        "/pages/task/assign-sellable-component-to-day",
        {
          payload: {
            component_swap_type: swapType,
            portions: String(portions),
            required_amount_by_selling_unit_id: selected,
            selected_component_id: ingredientId,
            selling_group_id: id,
          },
        },
        true
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json({ error: "Your token has expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save ingredient selection" }, { status: 502 });
  }
}
