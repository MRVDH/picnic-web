"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCart } from "@/contexts/cart-context";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { formatEuroPrice } from "@/lib/core/format-price";
import { buildImageUrl } from "@/lib/core/image-url";
import type {
  ApiErrorResponse,
  MealPlanShoppingListRequest,
  MealPlanShoppingListResponse,
} from "@/lib/core/types";

const PLACEHOLDER = "/placeholder-product.svg";

type ShoppingListModalProps = {
  recipeIds: string[];
  people: number;
  onClose: () => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: MealPlanShoppingListResponse }
  | { status: "error"; message: string };

type AddState = "idle" | "adding" | "done";

export function ShoppingListModal({ recipeIds, people, onClose }: ShoppingListModalProps) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const { refresh } = useCart();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [addState, setAddState] = useState<AddState>("idle");

  useEffect(() => {
    const controller = new AbortController();
    const body: MealPlanShoppingListRequest = { recipeIds, people };
    fetch("/api/meal-plan/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: MealPlanShoppingListResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          setLoadState({ status: "error", message: t.mealPlanShoppingListError });
          return;
        }
        setLoadState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadState({ status: "error", message: t.mealPlanShoppingListError });
      });
    return () => controller.abort();
  }, [recipeIds, people, t.mealPlanShoppingListError]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleAddAll = async () => {
    if (loadState.status !== "ready" || addState !== "idle") return;
    setAddState("adding");
    const { data } = loadState;

    // Sequentially, not concurrently — mirrors the existing per-recipe
    // add-to-cart route's own sequential ingredient loop, avoiding concurrent
    // cart-mutation conflicts on the Picnic API side.
    for (const recipe of data.recipes) {
      const selectedIngredients = data.items
        .filter((item) => item.ownerRecipeId === recipe.id)
        .map((item) => ({
          id: item.ownerSellingUnitId,
          ingredientId: item.ingredientId,
          count: item.packagesNeeded,
        }));
      if (selectedIngredients.length === 0) continue;
      try {
        await fetch(`/api/recipe/${encodeURIComponent(recipe.id)}/add-to-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portions: people, selectedIngredients }),
        });
      } catch {
        // Continue with the remaining recipes; refresh() below reflects whatever succeeded.
      }
    }

    refresh();
    setAddState("done");
    setTimeout(() => setAddState("idle"), 2500);
  };

  const addLabel =
    addState === "adding"
      ? t.mealPlanAddingToCart
      : addState === "done"
        ? t.mealPlanAddedToCart
        : t.mealPlanAddAllToCart;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopping-list-title"
        className="bg-card-bg flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="shopping-list-title" className="text-foreground text-lg font-bold">
            {t.mealPlanShoppingListTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeLabel}
            className="hover:text-foreground rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {loadState.status === "loading" && <LoadingSpinner />}
          {loadState.status === "error" && (
            <p className="py-8 text-center text-sm text-red-600">{loadState.message}</p>
          )}
          {loadState.status === "ready" && (
            <>
              <p className="text-picnic-red py-3 text-sm font-medium">
                {t.mealPlanPackagesSaved.replace("{n}", String(loadState.data.packagesSaved))}
              </p>
              <div className="divide-y divide-gray-100">
                {loadState.data.items.map((item) => {
                  const sharedWith = loadState.data.recipes.find(
                    (r) => r.id !== item.ownerRecipeId && item.usedInRecipeIds.includes(r.id)
                  );
                  return (
                    <div key={item.ingredientId} className="flex items-center gap-3 py-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={
                            item.imageId ? buildImageUrl(item.imageId, countryCode) : PLACEHOLDER
                          }
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-text-dark truncate text-sm font-medium">{item.name}</p>
                        {sharedWith && (
                          <p className="text-text-muted text-xs">
                            {t.mealPlanSharedWith.replace("{recipe}", sharedWith.name)}
                          </p>
                        )}
                      </div>
                      <div className="text-text-dark shrink-0 text-sm font-medium">
                        {item.packagesNeeded}× {formatEuroPrice(item.unitPriceCents)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          {loadState.status === "ready" && (
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-text-muted">{t.mealPlanTotal}</span>
              <span className="text-foreground font-bold">
                {formatEuroPrice(loadState.data.totalPriceCents)}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleAddAll}
            disabled={loadState.status !== "ready" || addState !== "idle"}
            className="bg-picnic-red w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
