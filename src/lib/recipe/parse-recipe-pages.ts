// Reads the recipe tiles of the DE recipe-cattree-* pages (see recipe-cattree-pages.ts), which the
// app doesn't link to, so picnic-api has no method for them. Other recipe lists come from picnic-api.
import type { RecipeItem } from "@/lib/core/types";
import {
  type AnalyticsContext,
  type PmlNode,
  cleanMarkdown,
  collectMarkdowns,
  collectPropertyValues,
} from "@/lib/pml/pml-helpers";

const RECIPE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/";

/** Minutes in a tag such as "20 min", "15 + 25 min" (preparation plus waiting) or "1 Std 10 min". */
function parseMinutes(tag: string): number | null {
  const sum = tag.match(/^(\d+(?:\s*\+\s*\d+)*)\s*min/i)?.[1];
  if (sum) return sum.split("+").reduce((total, part) => total + Number(part.trim()), 0);
  const hours = tag.match(/(\d+)\s*(?:uur|u|std|h)\b/i)?.[1];
  const minutes = tag.match(/(\d+)\s*min/i)?.[1];
  if (hours === undefined && minutes === undefined) return null;
  return Number(hours ?? 0) * 60 + Number(minutes ?? 0);
}

/** The cooking time of the first tag that states one, e.g. ["Vegan", "20 min"] → 20. */
function firstMinutes(tags: string[]): number | null {
  return tags.map(parseMinutes).find((minutes) => minutes !== null) ?? null;
}

function recipeContext(node: PmlNode): Record<string, unknown> | null {
  const contexts = (node.analytics as { contexts?: AnalyticsContext[] } | undefined)?.contexts;
  const context = contexts?.find(
    (c) => c?.schema?.startsWith(RECIPE_SCHEMA) && typeof c.data?.recipe_id === "string"
  );
  return context?.data ?? null;
}

function readTile(node: PmlNode, recipe: Record<string, unknown>): RecipeItem | null {
  const texts = collectMarkdowns(node.pml ?? node)
    .map(cleanMarkdown)
    .filter(Boolean);
  const analyticsName = typeof recipe.recipe_name === "string" ? recipe.recipe_name.trim() : "";
  const name = analyticsName || texts[0] || "";
  if (!name) return null;
  const tags = texts.slice(texts.indexOf(name) + 1);
  const image = collectPropertyValues(node, "source").find(
    (source): source is { id: string } =>
      typeof (source as { id?: unknown } | null)?.id === "string"
  );
  return {
    id: recipe.recipe_id as string,
    name,
    imageId: image?.id ?? null,
    cookingTimeMinutes: firstMinutes(tags),
  };
}

/** Every recipe tile of a Fusion page in order, each recipe once. */
export function parseRecipeTiles(page: unknown): RecipeItem[] {
  const recipes = new Map<string, RecipeItem>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value !== "object" || value === null) return;
    const node = value as PmlNode;
    const recipe = (node.type === "PML" || node.type === "BLOCK") && recipeContext(node);
    if (!recipe) return Object.values(node).forEach(visit);
    const item = readTile(node, recipe);
    if (item && !recipes.has(item.id)) recipes.set(item.id, item);
  };
  visit(page);
  return [...recipes.values()];
}
