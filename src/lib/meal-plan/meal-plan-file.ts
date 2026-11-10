// The file a meal plan is exported to and imported from, so a plan can move to another browser.
import type { MealPlanCacheEntry } from "@/hooks/use-meal-plan-cache";
import { MEAL_PLAN_MAX_DAYS, MEAL_PLAN_MAX_PEOPLE } from "@/lib/core/constants";
import type { RecipeItem } from "@/lib/core/types";

const FILE_TYPE = "picnic-meal-plan";
const FILE_VERSION = 1;

type MealPlanFile = {
  type: typeof FILE_TYPE;
  version: typeof FILE_VERSION;
  exportedAt: string;
  plan: MealPlanCacheEntry;
};

export function serializeMealPlan(plan: MealPlanCacheEntry, now: Date = new Date()): string {
  const file: MealPlanFile = {
    type: FILE_TYPE,
    version: FILE_VERSION,
    exportedAt: now.toISOString(),
    plan,
  };
  return JSON.stringify(file, null, 2);
}

/** e.g. picnic-meal-plan-2026-11-08.json, after the local date. */
export function mealPlanFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `picnic-meal-plan-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const clamp = (value: number, max: number) => Math.min(max, Math.max(1, Math.round(value)));

function readRecipe(value: unknown): RecipeItem | null {
  if (!isRecord(value)) return null;
  const { id, name, imageId, cookingTimeMinutes } = value;
  if (typeof id !== "string" || !id || typeof name !== "string" || !name) return null;
  return {
    id,
    name,
    imageId: typeof imageId === "string" ? imageId : null,
    cookingTimeMinutes: typeof cookingTimeMinutes === "number" ? cookingTimeMinutes : null,
  };
}

function readPlan(value: unknown): MealPlanCacheEntry | null {
  if (!isRecord(value) || !Array.isArray(value.recipes)) return null;
  if (typeof value.days !== "number" || typeof value.people !== "number") return null;
  const recipes: RecipeItem[] = [];
  for (const item of value.recipes) {
    const recipe = readRecipe(item);
    if (!recipe) return null;
    if (!recipes.some((r) => r.id === recipe.id)) recipes.push(recipe);
  }
  if (recipes.length === 0) return null;
  return {
    recipes,
    days: clamp(value.days, MEAL_PLAN_MAX_DAYS),
    people: clamp(value.people, MEAL_PLAN_MAX_PEOPLE),
  };
}

/**
 * The plan in an exported file, or in the raw value of the localStorage entry. Null when the
 * text is not a meal plan this version can read.
 */
export function parseMealPlanFile(text: string): MealPlanCacheEntry | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (isRecord(value) && value.type === FILE_TYPE) {
    return value.version === FILE_VERSION ? readPlan(value.plan) : null;
  }
  return readPlan(value);
}
