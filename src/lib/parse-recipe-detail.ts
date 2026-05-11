import { cleanMarkdown } from "./pml-helpers";
import type { RecipeDetail, RecipeIngredient } from "./types";

type PmlRecord = Record<string, unknown>;

type RawSellingUnit = {
  id: string;
  name: string;
  image_id: string;
  display_price: number;
  unit_quantity: string;
  max_count: number;
};

type RecipeAnalyticsUnit = {
  selling_unit_id: string;
  quantity: number;
  checked: boolean;
  status: string;
};

type RecipeAnalyticsData = {
  recipe_id: string;
  recipe_name: string;
  portions: number;
  cooking_time_minutes?: number;
  selling_units: RecipeAnalyticsUnit[];
};

type TileData = {
  name: string;
  imageId: string | null;
  displayPrice: number;
  unitQuantity: string;
  maxCount: number;
};

/** Find the recipe analytics context (schema contains "recipe"). */
function findRecipeAnalyticsData(obj: unknown): RecipeAnalyticsData | null {
  if (typeof obj !== "object" || obj === null) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findRecipeAnalyticsData(item);
      if (r) return r;
    }
    return null;
  }
  const record = obj as PmlRecord;
  const analytics = record.analytics as { contexts?: unknown[] } | undefined;
  for (const ctx of analytics?.contexts ?? []) {
    if (typeof ctx !== "object" || ctx === null) continue;
    const c = ctx as PmlRecord;
    if (typeof c.schema === "string" && c.schema.includes("recipe")) {
      const data = c.data as PmlRecord | undefined;
      if (data && Array.isArray(data.selling_units) && typeof data.recipe_id === "string") {
        return data as unknown as RecipeAnalyticsData;
      }
    }
  }
  for (const value of Object.values(record)) {
    const r = findRecipeAnalyticsData(value);
    if (r) return r;
  }
  return null;
}

/**
 * Walk the entire Fusion page tree and collect all sellingUnit objects,
 * keyed by their id. Works regardless of tile container ID naming convention.
 *
 * A sellingUnit is identified by having: id (string starting with "s"),
 * name (string), display_price (number), unit_quantity (string).
 */
function collectSellingUnitMap(obj: unknown, map: Map<string, TileData>): void {
  if (typeof obj !== "object" || obj === null) return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectSellingUnitMap(item, map);
    return;
  }
  const record = obj as PmlRecord;

  // Detect a sellingUnit object: has id starting with "s", name, display_price
  if (
    typeof record.id === "string" &&
    /^s\d+$/.test(record.id) &&
    typeof record.name === "string" &&
    typeof record.display_price === "number"
  ) {
    const su = record as unknown as RawSellingUnit;
    if (!map.has(su.id)) {
      map.set(su.id, {
        name: cleanMarkdown(su.name),
        imageId: su.image_id ?? null,
        displayPrice: su.display_price,
        unitQuantity: su.unit_quantity ?? "",
        maxCount: su.max_count ?? 99,
      });
    }
  }

  for (const value of Object.values(record)) {
    collectSellingUnitMap(value, map);
  }
}

/** Extract the first IMAGE source id from a PML subtree. */
function extractImageId(obj: unknown): string | null {
  if (typeof obj !== "object" || obj === null) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const id = extractImageId(item);
      if (id) return id;
    }
    return null;
  }
  const record = obj as PmlRecord;
  if (record.type === "IMAGE") {
    const source = record.source as { id?: string } | undefined;
    if (typeof source?.id === "string") return source.id;
    const fallback = record.fallbackSource as { id?: string } | undefined;
    if (typeof fallback?.id === "string") return fallback.id;
  }
  for (const value of Object.values(record)) {
    const id = extractImageId(value);
    if (id) return id;
  }
  return null;
}

/** Collect step strings from numbered RICH_TEXT nodes. */
function extractSteps(obj: unknown): string[] {
  const steps: string[] = [];
  collectSteps(obj, steps);
  return steps;
}

function collectSteps(obj: unknown, steps: string[]): void {
  if (typeof obj !== "object" || obj === null) return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectSteps(item, steps);
    return;
  }
  const record = obj as PmlRecord;
  if (
    record.type === "RICH_TEXT" &&
    typeof record.markdown === "string" &&
    /^\d+[.)]\s/.test(record.markdown)
  ) {
    steps.push(cleanMarkdown(record.markdown));
    return;
  }
  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) collectSteps(value, steps);
  }
}

/**
 * Parse a selling-group-details-page (DE) or recipe-details-page-root (NL)
 * Fusion page into a typed RecipeDetail.
 *
 * The analytics context on the root BLOCK contains:
 *   recipe_id, recipe_name, portions, selling_units[{selling_unit_id, quantity, checked}]
 *
 * checked=true  → required ingredient (isCondiment=false)
 * checked=false → optional/staple (isCondiment=true)
 */
export function parseRecipeDetail(rawPage: unknown, recipeId: string): RecipeDetail {
  // ── 1. Recipe metadata from analytics context ─────────────────────────────
  const meta = findRecipeAnalyticsData(rawPage);

  const name = meta?.recipe_name ?? "";
  const portions = meta?.portions ?? 2;
  const cookingTimeMinutes = meta?.cooking_time_minutes ?? null;

  // ── 2. Hero image ─────────────────────────────────────────────────────────
  const imageId = extractImageId(rawPage);

  // ── 3. Build selling unit map by scanning the entire tree ─────────────────
  const tileMap = new Map<string, TileData>();
  collectSellingUnitMap(rawPage, tileMap);

  // ── 4. Build ingredient list from analytics selling_units ─────────────────
  const ingredients: RecipeIngredient[] = [];
  const seen = new Set<string>();

  for (const unit of meta?.selling_units ?? []) {
    if (!unit.selling_unit_id || seen.has(unit.selling_unit_id)) continue;
    if (unit.status !== "ACTIVE") continue;
    seen.add(unit.selling_unit_id);

    const tile = tileMap.get(unit.selling_unit_id);
    ingredients.push({
      id: unit.selling_unit_id,
      name: tile?.name ?? unit.selling_unit_id,
      imageId: tile?.imageId ?? null,
      displayPrice: tile?.displayPrice ?? 0,
      unitQuantity: tile?.unitQuantity ?? "",
      maxCount: tile?.maxCount ?? 99,
      quantity: unit.quantity ?? 1,
      isCondiment: !unit.checked,
    });
  }

  // ── 5. Steps ──────────────────────────────────────────────────────────────
  const steps = extractSteps(rawPage);

  return {
    id: recipeId,
    name: name || recipeId,
    imageId,
    cookingTimeMinutes,
    portions,
    ingredients,
    steps,
  };
}
