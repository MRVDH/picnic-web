"use client";

import type { MouseEvent } from "react";

import { useTranslations } from "@/contexts/country-context";
import { useSavedRecipes } from "@/contexts/saved-recipes-context";

type FavoriteButtonProps = {
  recipeId: string;
  /** Positioning classes supplied by the parent (the button styles itself). */
  className?: string;
};

/**
 * Heart toggle for saving a recipe to the user's Picnic account.
 *
 * Render it as a SIBLING of a card's link, never nested inside it — a <button>
 * inside an <a> is invalid HTML. The click is stopped as a safety net for
 * layouts that put the button inside some other clickable region.
 */
export function FavoriteButton({ recipeId, className = "" }: FavoriteButtonProps) {
  const t = useTranslations();
  const { isSaved, toggleSaved } = useSavedRecipes();
  const saved = isSaved(recipeId);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleSaved(recipeId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? t.recipeUnsave : t.recipeSave}
      aria-pressed={saved}
      title={saved ? t.recipeUnsave : t.recipeSave}
      className={`focus:ring-picnic-red bg-card-bg/85 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-transform hover:scale-110 focus:ring-2 focus:outline-none ${className}`}
    >
      <svg
        className={`h-4.5 w-4.5 transition-colors ${saved ? "text-picnic-red" : "text-text-muted"}`}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
