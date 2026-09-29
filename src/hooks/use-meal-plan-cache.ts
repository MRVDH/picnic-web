"use client";

import { useSyncExternalStore } from "react";

import type { RecipeItem } from "@/lib/core/types";

/**
 * Confirmed meal-plan recipes, kept in localStorage so a "Recent food plan"
 * button can restore them across visits. Cleared on sign-out and by the
 * explicit "Clear plan" action.
 */
export type MealPlanCacheEntry = { recipes: RecipeItem[]; days: number; people: number };

const STORAGE_KEY = "picnic_meal_plan_confirmed";

const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let lastValue: MealPlanCacheEntry | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function isValidEntry(value: unknown): value is MealPlanCacheEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as MealPlanCacheEntry;
  return Array.isArray(v.recipes) && typeof v.days === "number" && typeof v.people === "number";
}

export function readMealPlanCache(): MealPlanCacheEntry | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === lastRaw) return lastValue;
  lastRaw = raw;
  lastValue = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValidEntry(parsed)) lastValue = parsed;
    } catch {
      lastValue = null;
    }
  }
  return lastValue;
}

export function writeMealPlanCache(entry: MealPlanCacheEntry): void {
  const raw = JSON.stringify(entry);
  if (raw === lastRaw) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable (private mode, quota): the plan simply won't persist.
  }
  emit();
}

/** Call on sign-out, and from the explicit "Clear plan" action. */
export function clearMealPlanCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): MealPlanCacheEntry | null {
  return null;
}

export function useMealPlanCache(): MealPlanCacheEntry | null {
  return useSyncExternalStore(subscribe, readMealPlanCache, getServerSnapshot);
}
