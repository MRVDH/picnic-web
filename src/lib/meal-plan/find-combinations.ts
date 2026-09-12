import type { MealPlanCombination, RecipeDetail } from "@/lib/core/types";
import { scoreCombination } from "@/lib/meal-plan/consolidate-ingredients";

/** Above this many combinations, fall back to greedy search instead of enumerating all of them. */
const EXHAUSTIVE_LIMIT = 30_000;

function nChooseK(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

/**
 * Find the top `topK` combinations of `slots` new recipes from `candidates`
 * that maximize packages saved, scored together with the already-confirmed
 * `fixed` recipes (so new picks are chosen to minimize waste against what's
 * already locked in, not in isolation). Tie-broken by lowest total price.
 *
 * Exhaustive search when C(candidates, slots) fits within EXHAUSTIVE_LIMIT —
 * guarantees the optimal result. Otherwise falls back to greedy across all
 * candidates: try each as a starting pick, greedily add the next-best
 * addition by score, for every candidate.
 */
export function findBestCombinations(
  candidates: RecipeDetail[],
  slots: number,
  fixed: RecipeDetail[],
  topK: number
): MealPlanCombination[] {
  if (slots <= 0 || candidates.length === 0) return [];

  // Filter out recipes already in fixed to avoid double-scoring if a recipe
  // appears in both sets.
  const fixedIds = new Set(fixed.map((r) => r.id));
  const selectable = candidates.filter((r) => !fixedIds.has(r.id));
  if (selectable.length === 0) return [];

  const seen = new Map<string, MealPlanCombination>();

  function addResult(combo: RecipeDetail[]) {
    const key = combo
      .map((r) => r.id)
      .sort()
      .join(",");
    if (seen.has(key)) return;
    const { packagesSaved, totalPriceCents } = scoreCombination([...fixed, ...combo]);
    seen.set(key, { recipeIds: combo.map((r) => r.id), packagesSaved, totalPriceCents });
  }

  const useExhaustive = nChooseK(selectable.length, slots) <= EXHAUSTIVE_LIMIT;
  const pool = selectable;

  if (useExhaustive) {
    function combine(start: number, current: RecipeDetail[]) {
      if (current.length === slots) {
        addResult(current);
        return;
      }
      for (let i = start; i <= pool.length - (slots - current.length); i++) {
        combine(i + 1, [...current, pool[i]]);
      }
    }
    combine(0, []);
  } else {
    for (const start of pool) {
      const selected: RecipeDetail[] = [start];
      const selectedIds = new Set([start.id]);
      while (selected.length < slots) {
        let bestScore = -1;
        let bestRecipe: RecipeDetail | null = null;
        for (const candidate of pool) {
          if (selectedIds.has(candidate.id)) continue;
          const { packagesSaved } = scoreCombination([...fixed, ...selected, candidate]);
          if (packagesSaved > bestScore) {
            bestScore = packagesSaved;
            bestRecipe = candidate;
          }
        }
        if (!bestRecipe) break;
        selected.push(bestRecipe);
        selectedIds.add(bestRecipe.id);
      }
      if (selected.length === slots) addResult(selected);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.packagesSaved - a.packagesSaved || a.totalPriceCents - b.totalPriceCents)
    .slice(0, topK);
}
