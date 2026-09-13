"use client";

import { RecipeCard } from "@/components/recipe/recipe-card";
import { useTranslations } from "@/contexts/country-context";
import type { RecipeItem } from "@/lib/core/types";

type PlanRecipeCardProps = {
  recipe: RecipeItem;
  confirmed: boolean;
  onToggleConfirmed: (recipeId: string) => void;
  disabled?: boolean;
};

/**
 * Wraps the generic RecipeCard with a "keep this recipe" checkbox for the
 * meal-plan grid, opposite the card's own favorite-button corner.
 */
export function PlanRecipeCard({
  recipe,
  confirmed,
  onToggleConfirmed,
  disabled = false,
}: PlanRecipeCardProps) {
  const t = useTranslations();
  return (
    <div className="relative">
      <label
        title={t.mealPlanConfirmLabel}
        className="border-card-border bg-card-bg absolute top-2 left-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border shadow-sm"
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={() => onToggleConfirmed(recipe.id)}
          disabled={disabled}
          aria-label={t.mealPlanConfirmLabel}
          className="accent-picnic-red h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
        />
      </label>
      <RecipeCard recipe={recipe} />
    </div>
  );
}
