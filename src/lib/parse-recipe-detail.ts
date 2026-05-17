import { cleanMarkdown, collectMarkdowns, stripColorTags } from "./pml-helpers";
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
  ingredient_id?: string;
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

/**
 * Try to extract cooking time (minutes) from page markdowns.
 * Matches patterns like "45 Min.", "30 min", or adjacent number + "min" lines.
 */
function extractCookingTimeFromMarkdowns(markdowns: string[]): number | null {
  const cleaned = markdowns.map((md) => cleanMarkdown(md).trim()).filter(Boolean);
  for (let i = 0; i < cleaned.length; i++) {
    const line = cleaned[i];
    // "45 Min." or "30 min" on a single line
    const combined = /^(\d+)\s*[Mm]in\.?$/.exec(line);
    if (combined) return parseInt(combined[1], 10);
    // Adjacent pair: number on one line, "Min." / "min" on the next
    if (/^\d+$/.test(line) && i + 1 < cleaned.length && /^[Mm]in\.?$/.test(cleaned[i + 1])) {
      return parseInt(line, 10);
    }
  }
  return null;
}

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

/**
 * Matches the "(100 g benötigt)" / "(0.5 EL benötigt)" / "(100 ml nodig)" style
 * markdown that Picnic embeds inline in the recipe ingredient list.
 */
const NEEDED_MD_RE = /^\(\d+(?:[.,]\d+)?\s+\S/;
const PACKAGE_SIZE_RE = /^\d+\s*(g|ml|kg|l)\b/i;

type RecipeIngredientInfo = { neededText: string | null; packageSize: string | null };

/**
 * Map each ACTIVE selling unit (in analytics order) to its "(X unit benötigt)"
 * string and the package size that precedes it in the markdown stream.
 * Both appear in the same order as the analytics selling_units.
 */
function buildRecipeQuantityMap(
  rawPage: unknown,
  sellingUnits: RecipeAnalyticsUnit[]
): Map<string, RecipeIngredientInfo> {
  const result = new Map<string, RecipeIngredientInfo>();

  const seen = new Set<string>();
  const activeIds: string[] = [];
  for (const u of sellingUnits) {
    if (!u.selling_unit_id || seen.has(u.selling_unit_id)) continue;
    if (u.status !== "ACTIVE") continue;
    seen.add(u.selling_unit_id);
    activeIds.push(u.selling_unit_id);
  }
  if (activeIds.length === 0) return result;

  const allMarkdowns = collectMarkdowns(rawPage)
    .map((md) => cleanMarkdown(md).trim())
    .filter(Boolean);

  const pairs: RecipeIngredientInfo[] = [];
  let prevMd: string | null = null;

  for (const md of allMarkdowns) {
    if (NEEDED_MD_RE.test(md)) {
      const packageSize = prevMd && PACKAGE_SIZE_RE.test(prevMd) ? prevMd : null;
      pairs.push({ neededText: md, packageSize });
    }
    prevMd = md;
  }

  for (let i = 0; i < Math.min(activeIds.length, pairs.length); i++) {
    result.set(activeIds[i], pairs[i]);
  }

  return result;
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
 * Extract the Picnic portion-limit warning from the markdown stream.
 * Picnic includes this when the requested portions exceed what the recipe
 * steps cover, e.g. "Achtung: Diese Kochanleitung gilt für 4 Portionen."
 * Matches "Achtung" (DE) or "Let op" (NL) at the start of a line.
 */
function parseStepsWarningFromMarkdowns(markdowns: string[]): string | null {
  for (const raw of markdowns) {
    const clean = stripColorTags(cleanMarkdown(raw)).trim();
    if (/^(achtung|let op)[:\s]/i.test(clean)) return clean;
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
      steps.push(stripColorTags(raw).trim());
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
 * Walk the recipe Fusion page and collect ingredient tile display names,
 * keyed by the product_id found in the product analytics context.
 * These are the short "recipe" names (e.g. "Champignons weiß") as opposed to
 * the full catalog names on the product detail page (e.g. "Champignons weiß mittel").
 */
function buildIngredientTileNameMap(rawPage: unknown): Map<string, string> {
  const result = new Map<string, string>();

  function getMarkdowns(obj: unknown, acc: string[]): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach((v) => getMarkdowns(v, acc)); return; }
    const o = obj as PmlRecord;
    if (typeof o.markdown === "string") acc.push(o.markdown);
    for (const v of Object.values(o)) getMarkdowns(v, acc);
  }

  function walk(obj: unknown, depth: number): void {
    if (depth > 60 || !obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach((v) => walk(v, depth + 1)); return; }
    const o = obj as PmlRecord;
    if (o.type === "PML" && o.analytics && o.pml) {
      const ctxs = (o.analytics as { contexts?: unknown[] }).contexts ?? [];
      const productCtx = ctxs.find(
        (c): c is PmlRecord =>
          typeof c === "object" &&
          c !== null &&
          typeof (c as PmlRecord).schema === "string" &&
          ((c as PmlRecord).schema as string).includes("/product/") &&
          typeof ((c as PmlRecord).data as PmlRecord | undefined)?.product_id === "string"
      );
      if (productCtx) {
        const productId = ((productCtx.data as PmlRecord).product_id as string);
        const markdowns: string[] = [];
        getMarkdowns(o.pml, markdowns);
        const clean = markdowns
          .map((t) => t.replace(/#\([^)]+\)/g, "").replace(/\*\*/g, "").replace(/\xa0/g, " ").trim())
          .filter(Boolean);
        const name = clean.find(
          (t) =>
            !/^[><%]/.test(t) &&
            !/^-?\d+%/.test(t) &&
            !/^\d+[.,]\d+$/.test(t) &&
            !/€/.test(t) &&
            !/jetzt|nu\s+tijdelijk/i.test(t)
        );
        if (name && productId && !result.has(productId)) result.set(productId, name);
        return;
      }
    }
    for (const v of Object.values(o)) walk(v, depth + 1);
  }

  walk(rawPage, 0);
  return result;
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

  // ── 2. Hero image ─────────────────────────────────────────────────────────
  const imageId = extractImageId(rawPage);

  // ── 3. Build selling unit map (may find some stub data) ───────────────────
  const tileMap = new Map<string, TileData>();
  collectSellingUnitMap(rawPage, tileMap);

  // ── 4. Build ingredient tile name map (short display names from recipe PML) ─
  const tileNameByProductId = buildIngredientTileNameMap(rawPage);
  // Map selling_unit_id → tile name via ingredient_id
  const tileNameByUnitId = new Map<string, string>();
  for (const unit of meta?.selling_units ?? []) {
    if (unit.ingredient_id) {
      const tileName = tileNameByProductId.get(unit.ingredient_id);
      if (tileName) tileNameByUnitId.set(unit.selling_unit_id, tileName);
    }
  }

  // ── 5. Build ingredient list from analytics selling_units ─────────────────
  const recipeQtyMap = buildRecipeQuantityMap(rawPage, meta?.selling_units ?? []);
  const ingredients: RecipeIngredient[] = [];
  const seen = new Set<string>();
  const seenIngredientIds = new Set<string>();

  for (const unit of meta?.selling_units ?? []) {
    if (!unit.selling_unit_id || seen.has(unit.selling_unit_id)) continue;
    if (unit.status !== "ACTIVE") continue;
    // Deduplicate by ingredient_id: the API may return both a single-pack and a
    // bundle SKU for the same ingredient (e.g. s1023576 and s1089939 for Basmati Reis).
    // Keep only the first (primary) recommendation.
    if (unit.ingredient_id && seenIngredientIds.has(unit.ingredient_id)) continue;
    seen.add(unit.selling_unit_id);
    if (unit.ingredient_id) seenIngredientIds.add(unit.ingredient_id);

    const tile = tileMap.get(unit.selling_unit_id);
    const recipeInfo = recipeQtyMap.get(unit.selling_unit_id) ?? null;
    // Tile name from the recipe page PML takes priority over the catalog name
    const displayName =
      tileNameByUnitId.get(unit.selling_unit_id) ?? tile?.name ?? unit.selling_unit_id;
    ingredients.push({
      id: unit.selling_unit_id,
      name: displayName,
      imageId: tile?.imageId ?? null,
      displayPrice: tile?.displayPrice ?? 0,
      unitQuantity: tile?.unitQuantity ?? "",
      maxCount: tile?.maxCount ?? 99,
      quantity: unit.quantity ?? 1,
      isCondiment: !unit.checked,
      nutritionRows: [],
      recipeQuantityText: recipeInfo?.neededText ?? null,
      recipePackageSize: recipeInfo?.packageSize ?? null,
      originalPrice: null,
      priceRanges: null,
    });
  }

  // ── 5. Parse sections from the flat markdown stream ───────────────────────
  const allMarkdowns = collectMarkdowns(rawPage);
const steps = parseStepsFromMarkdowns(allMarkdowns);
  const stepsPortionWarning = parseStepsWarningFromMarkdowns(allMarkdowns);
  const recipeNutritionRows = parseNutritionFromMarkdowns(allMarkdowns);
  const allergens = parseAllergensFromMarkdowns(allMarkdowns);
  const cookingTimeMinutes =
    meta?.cooking_time_minutes != null
      ? meta.cooking_time_minutes
      : extractCookingTimeFromMarkdowns(allMarkdowns);

  return {
    id: recipeId,
    name: name || recipeId,
    imageId,
    cookingTimeMinutes,
    portions,
    ingredients,
    steps,
    stepsPortionWarning,
    recipeNutritionRows,
    allergens,
  };
}
