"use client";

/**
 * Saved-recipe state, backed by the user's Picnic account.
 *
 * Picnic owns the saved list — this context mirrors it client-side so hearts can
 * render instantly, applies optimistic updates on toggle, and rolls back to the
 * last server-confirmed state when a mutation fails.
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useTranslations } from "@/contexts/country-context";
import { createMutationQueue } from "@/lib/cart/mutation-queue";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { ApiErrorResponse, SavedRecipesApiResponse } from "@/lib/core/types";

type SavedRecipesContextValue = {
  /** True when the recipe is saved on the user's Picnic account. */
  isSaved: (recipeId: string) => boolean;
  /** Flip the saved state, optimistically. */
  toggleSaved: (recipeId: string) => void;
};

const SavedRecipesContext = createContext<SavedRecipesContextValue | null>(null);

export function useSavedRecipes(): SavedRecipesContextValue {
  const ctx = useContext(SavedRecipesContext);
  if (!ctx) {
    throw new Error("useSavedRecipes must be used within a SavedRecipesProvider");
  }
  return ctx;
}

/** Returns the context value if inside a provider, else null. */
export function useSavedRecipesOptional(): SavedRecipesContextValue | null {
  return useContext(SavedRecipesContext);
}

type SavedRecipesProviderProps = {
  children: ReactNode;
  showToast?: (message: string) => void;
};

export function SavedRecipesProvider({ children, showToast }: SavedRecipesProviderProps) {
  const t = useTranslations();
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(() => new Set());

  /** Last state the server confirmed — the rollback target. */
  const confirmedRef = useRef<ReadonlySet<string>>(new Set());
  /** Current optimistic state, tracked synchronously so rapid taps don't race. */
  const optimisticRef = useRef<ReadonlySet<string>>(new Set());

  // The mutation queue is created once, so it reads these through refs rather
  // than closing over the first render's values.
  const showToastRef = useRef(showToast);
  const errorMessageRef = useRef(t.recipeSaveError);
  useEffect(() => {
    showToastRef.current = showToast;
    errorMessageRef.current = t.recipeSaveError;
  }, [showToast, t.recipeSaveError]);

  // Load the saved list once. A failure leaves every heart unsaved but still
  // toggleable, so a broken read degrades instead of disabling the feature.
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/recipe/saved", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: SavedRecipesApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        const ids = new Set(Array.isArray(data.recipeIds) ? data.recipeIds : []);
        confirmedRef.current = ids;
        optimisticRef.current = ids;
        setSavedIds(ids);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const queueRef = useRef<ReturnType<typeof createMutationQueue<boolean>> | null>(null);

  useEffect(() => {
    queueRef.current = createMutationQueue<boolean>((recipeId, result, error) => {
      if (error !== null || result === null) {
        // Roll the one recipe back to its confirmed state; leave the rest alone.
        const rolledBack = new Set(optimisticRef.current);
        if (confirmedRef.current.has(recipeId)) rolledBack.add(recipeId);
        else rolledBack.delete(recipeId);
        optimisticRef.current = rolledBack;
        setSavedIds(rolledBack);
        showToastRef.current?.(errorMessageRef.current);
        return;
      }

      const confirmed = new Set(confirmedRef.current);
      if (result) confirmed.add(recipeId);
      else confirmed.delete(recipeId);
      confirmedRef.current = confirmed;
    });
  }, []);

  const toggleSaved = useCallback((recipeId: string) => {
    // Derived synchronously from the ref so back-to-back taps queue the correct
    // target state rather than reading a not-yet-applied React state update.
    const next = new Set(optimisticRef.current);
    const nextSaved = !next.has(recipeId);
    if (nextSaved) next.add(recipeId);
    else next.delete(recipeId);

    optimisticRef.current = next;
    setSavedIds(next);

    queueRef.current?.enqueue(recipeId, async () => {
      const response = await fetch(`/api/recipe/${recipeId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: nextSaved }),
      });
      const data: { saved: boolean } & Partial<ApiErrorResponse> = await response.json();

      // Leaving for the login page — report success so the heart doesn't flash
      // back and toast an error on the way out.
      if (data.code === "TOKEN_EXPIRED") {
        window.location.href = TOKEN_EXPIRED_REDIRECT;
        return nextSaved;
      }

      if (!response.ok) throw new Error("Failed to update saved recipe");
      return data.saved;
    });
  }, []);

  const value = useMemo<SavedRecipesContextValue>(
    () => ({
      isSaved: (recipeId: string) => savedIds.has(recipeId),
      toggleSaved,
    }),
    [savedIds, toggleSaved]
  );

  return <SavedRecipesContext.Provider value={value}>{children}</SavedRecipesContext.Provider>;
}
