import { cleanMarkdown, collectMarkdowns } from "./pml-helpers";
import type { NutritionRow, RecipeDetail, RecipeIngredient } from "./types";

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
 */
function collectSellingUnitMap(obj: unknown, map: Map<string, TileData>): void {
  if (typeof obj !== "object" || obj === null) return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectSellingUnitMap(item, map);
    return;
  }
  const record = obj as PmlRecord;

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

/**
 * Extract preparation steps from the flat markdown list.
 * Pattern: "Schritt N" (DE) or "Stap N" (NL) header immediately followed by the
 * step content text.
 */
function parseStepsFromMarkdowns(markdowns: string[]): string[] {
  const steps: string[] = [];
  let expectingContent = false;
  for (const raw of markdowns) {
    const clean = cleanMarkdown(raw).trim();
    if (/^(schritt|stap)\s*\d+$/i.test(clean)) {
      expectingContent = true;
    } else if (expectingContent && clean && clean !== "Notiz" && clean !== "Hinzufügen...") {
      steps.push(clean);
      expectingContent = false;
    }
  }
  return steps;
}

/**
 * Extract per-serving nutrition rows from the flat markdown list.
 * Reads the section between "**Nährwerte**"/"**Voedingswaarde**" and "**Allergene**".
 * Pairs non-numeric labels with the following numeric value(s).
 */
function parseNutritionFromMarkdowns(markdowns: string[]): NutritionRow[] {
  const rows: NutritionRow[] = [];
  let inNutrition = false;
  let pendingLabel: string | null = null;
  const pendingValues: string[] = [];

  const flush = () => {
    if (pendingLabel === null || pendingValues.length === 0) return;
    // Filter out bare unit labels like "kcal" or "kJ" that appear between values
    const filtered = pendingValues.filter((v) => !/^(kcal|kJ)$/i.test(v.trim()));
    if (filtered.length === 0) return;
    const label = pendingLabel;
    const value = filtered.join(" / ");
    const isCategory =
      !label.toLowerCase().startsWith("davon") && !label.toLowerCase().startsWith("waarvan");
    rows.push({ label, value, isCategory, backgroundColor: null });
    pendingLabel = null;
    pendingValues.length = 0;
  };

  for (const raw of markdowns) {
    const clean = cleanMarkdown(raw).trim();
    if (!clean) continue;

    if (!inNutrition) {
      if (/nährwert|voedingswaarde/i.test(raw)) inNutrition = true;
      continue;
    }

    // Exit when we reach the allergen section
    if (/allergen/i.test(raw)) {
      flush();
      break;
    }

    // Skip subtitle lines (long descriptive phrases, not nutrient names)
    if (clean.length > 40 || /portion|ungefähr|bevat|enthält/i.test(clean)) continue;

    const hasDigit = /\d/.test(clean);
    const isUnitOnly = /^(kcal|kJ)$/i.test(clean);

    if (hasDigit || isUnitOnly) {
      if (pendingLabel !== null) pendingValues.push(clean);
    } else {
      flush();
      pendingLabel = clean;
    }
  }
  flush();
  return rows;
}

/**
 * Extract recipe-level allergens from the flat markdown list.
 * The recipe page aggregates allergens across all ingredients, split into
 * confirmed ("Die ausgewählten Zutaten enthalten:") and may-contain
 * ("Kann enthalten sein" / "Kan bevatten").
 */
function parseAllergensFromMarkdowns(
  markdowns: string[]
): { confirmed: string[]; mayContain: string[] } {
  const confirmed: string[] = [];
  const mayContain: string[] = [];
  let inAllergens = false;
  let afterIngredientHeader = false;
  let inMayContain = false;

  for (const raw of markdowns) {
    const clean = cleanMarkdown(raw).trim();

    if (!inAllergens) {
      if (/allergen/i.test(clean)) inAllergens = true;
      continue;
    }

    // Stop when we reach the next major content section
    if (/^(zutaten|ingrediënten|so wird|bereiding|schritt|stap)\b/i.test(clean)) break;

    // Sub-header marking start of the confirmed allergen list
    if (/zutaten.*enthalten|ingrediënten.*bevatten/i.test(clean)) {
      afterIngredientHeader = true;
      continue;
    }

    // Separator marking start of the may-contain list
    if (/kann enthalten|kan bevatten/i.test(clean)) {
      inMayContain = true;
      continue;
    }

    // Skip generic notes (e.g. "Dieses Rezept enthält keine Allergene")
    if (/keine allergene|geen allergenen|enthält keine|bevat geen/i.test(clean)) continue;
    if (!clean || clean.length > 40) continue;

    if (inMayContain) mayContain.push(clean);
    else if (afterIngredientHeader) confirmed.push(clean);
  }

  return { confirmed, mayContain };
}

/**
 * Parse a selling-group-details-page (DE) or recipe-details-page-root (NL)
 * Fusion page into a typed RecipeDetail.
 *
 * All section data (steps, nutrition, allergens) is extracted from the recipe
 * page itself. Ingredient product details (price, image, name) are enriched
 * separately by the API route.
 */
export function parseRecipeDetail(rawPage: unknown, recipeId: string): RecipeDetail {
  // ── 1. Recipe metadata from analytics context ─────────────────────────────
  const meta = findRecipeAnalyticsData(rawPage);

  const name = meta?.recipe_name ?? "";
  const portions = meta?.portions ?? 2;
  const cookingTimeMinutes = meta?.cooking_time_minutes ?? null;

  // ── 2. Hero image ─────────────────────────────────────────────────────────
  const imageId = extractImageId(rawPage);

  // ── 3. Build selling unit map (may find some stub data) ───────────────────
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
      nutritionRows: [],
    });
  }

  // ── 5. Parse sections from the flat markdown stream ───────────────────────
  const allMarkdowns = collectMarkdowns(rawPage);
  const steps = parseStepsFromMarkdowns(allMarkdowns);
  const recipeNutritionRows = parseNutritionFromMarkdowns(allMarkdowns);
  const allergens = parseAllergensFromMarkdowns(allMarkdowns);

  return {
    id: recipeId,
    name: name || recipeId,
    imageId,
    cookingTimeMinutes,
    portions,
    ingredients,
    steps,
    recipeNutritionRows,
    allergens,
  };
}
