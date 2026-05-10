import { cleanMarkdown, collectMarkdowns } from "./pml-helpers";
import type { RecipeCategory, RecipeItem } from "./types";

type PmlRecord = Record<string, unknown>;

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;

/**
 * Find nodes (BLOCK or PML type) whose analytics contexts carry a recipe_id.
 * Stops recursing into a matched node so we get the outermost recipe card.
 */
function findRecipeCardNodes(obj: unknown, results: PmlRecord[] = []): PmlRecord[] {
  if (typeof obj !== "object" || obj === null) return results;
  if (Array.isArray(obj)) {
    for (const item of obj) findRecipeCardNodes(item, results);
    return results;
  }
  const record = obj as PmlRecord;

  if (record.type === "BLOCK" || record.type === "PML") {
    const analytics = record.analytics as { contexts?: unknown[] } | undefined;
    for (const ctx of analytics?.contexts ?? []) {
      if (typeof ctx !== "object" || ctx === null) continue;
      const data = (ctx as PmlRecord).data as PmlRecord | undefined;
      if (data && typeof data.recipe_id === "string" && RECIPE_ID_RE.test(data.recipe_id)) {
        results.push(record);
        return results; // don't recurse into matched node
      }
    }

    // Also match on node ID ending with a 24-char hex that follows "recipe"
    if (typeof record.id === "string" && record.id.includes("recipe")) {
      const lastSegment = record.id.split("-").at(-1) ?? "";
      if (RECIPE_ID_RE.test(lastSegment)) {
        results.push(record);
        return results;
      }
    }
  }

  for (const value of Object.values(record)) {
    findRecipeCardNodes(value, results);
  }
  return results;
}

/** Extract the first IMAGE component source.id from a PML subtree. */
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

/** Extract recipe metadata from a node's analytics contexts. */
function extractFromAnalytics(
  node: PmlRecord
): { recipeId: string; name: string; cookingTimeMinutes: number | null } | null {
  const analytics = node.analytics as { contexts?: unknown[] } | undefined;
  for (const ctx of analytics?.contexts ?? []) {
    if (typeof ctx !== "object" || ctx === null) continue;
    const data = (ctx as PmlRecord).data as PmlRecord | undefined;
    if (!data || typeof data.recipe_id !== "string") continue;
    if (!RECIPE_ID_RE.test(data.recipe_id)) continue;

    const name =
      typeof data.name === "string"
        ? data.name
        : typeof data.recipe_name === "string"
          ? data.recipe_name
          : "";

    const cookingTimeMinutes =
      typeof data.cooking_time_minutes === "number" ? data.cooking_time_minutes : null;

    return { recipeId: data.recipe_id, name, cookingTimeMinutes };
  }
  return null;
}

/**
 * Parse recipe categories from the cookbook homepage Fusion page.
 *
 * Looks for TOUCHABLE nodes whose onPress is an OPEN action targeting a
 * recipe category page (id starts with "recipe-cattree-"). The display name
 * is taken from the first non-trivial markdown string inside the touchable.
 */
export function parseRecipeCategories(rawPage: unknown): RecipeCategory[] {
  const results: RecipeCategory[] = [];
  const seenIds = new Set<string>();
  collectCategories(rawPage, results, seenIds);
  return results;
}

function collectCategories(
  obj: unknown,
  results: RecipeCategory[],
  seenIds: Set<string>
): void {
  if (typeof obj !== "object" || obj === null) return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectCategories(item, results, seenIds);
    return;
  }
  const record = obj as PmlRecord;

  if (record.type === "TOUCHABLE") {
    const onPress = record.onPress as PmlRecord | undefined;
    if (
      onPress?.actionType === "OPEN" &&
      typeof onPress.target === "string" &&
      onPress.target.startsWith("recipe-cattree-") &&
      !seenIds.has(onPress.target)
    ) {
      const markdowns = collectMarkdowns(record);
      const name = markdowns.map(cleanMarkdown).find((m) => m.length > 1) ?? "";
      if (name) {
        seenIds.add(onPress.target);
        results.push({ id: onPress.target, name });
      }
      return; // don't recurse further into this touchable
    }
  }

  for (const value of Object.values(record)) {
    collectCategories(value, results, seenIds);
  }
}

/**
 * Parse the cookbook Fusion page into a list of recipe items.
 *
 * Tries two strategies in order:
 * 1. Find BLOCK/PML nodes whose analytics contexts carry recipe_id (and
 *    optionally name / cooking_time_minutes).
 * 2. Fall back to extracting the recipe_id from the node's own id string.
 *
 * For each matched recipe node the recipe name is taken from analytics data
 * first, falling back to the first non-trivial markdown string in the subtree.
 * The image ID is extracted from the first IMAGE component in the subtree.
 */
export function parseCookbookPage(rawPage: unknown): RecipeItem[] {
  const cardNodes = findRecipeCardNodes(rawPage);
  const seen = new Set<string>();
  const recipes: RecipeItem[] = [];

  for (const node of cardNodes) {
    const fromAnalytics = extractFromAnalytics(node);

    let recipeId = fromAnalytics?.recipeId ?? "";
    let name = fromAnalytics?.name ?? "";
    const cookingTimeMinutes = fromAnalytics?.cookingTimeMinutes ?? null;

    if (!recipeId) {
      const lastSegment = ((node.id as string) ?? "").split("-").at(-1) ?? "";
      if (RECIPE_ID_RE.test(lastSegment)) recipeId = lastSegment;
    }

    if (!recipeId || seen.has(recipeId)) continue;
    seen.add(recipeId);

    if (!name) {
      name = collectMarkdowns(node).map(cleanMarkdown).find((m) => m.length > 3) ?? "";
    }

    if (!name) continue;

    const imageId = extractImageId(node);
    recipes.push({ id: recipeId, name, imageId, cookingTimeMinutes });
  }

  return recipes;
}
