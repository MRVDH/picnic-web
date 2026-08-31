"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { CartToast } from "@/components/cart/cart-toast";
import { SharedHeader } from "@/components/layout/shared-header";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { RecipeSearchInput } from "@/components/recipe/recipe-search-input";
import { CategoryCheckboxPanel } from "@/components/ui/category-checkbox-panel";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "@/contexts/country-context";
import { SavedRecipesProvider } from "@/contexts/saved-recipes-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import { DEBOUNCE_DELAY_MS } from "@/lib/core/types";
import type { ApiErrorResponse, CookbookApiResponse, RecipeItem } from "@/lib/core/types";

const PAGE_SIZE = 24;
const DEFAULT_DAYS = 7;

// Stable identity so effects keyed on the recipe list don't re-run while loading.
const EMPTY_RECIPES: RecipeItem[] = [];

type RecipesState =
  | { status: "loading" }
  | { status: "success"; recipes: RecipeItem[] }
  | { status: "error"; message: string };

export default function CookbookPage() {
  const t = useTranslations();
  const router = useRouter();
  usePageTitle(t.cookbookTitle);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [selectedCategories, setSelectedCategories] = useState<(string | null)[]>([null]);
  const [daysCount, setDaysCount] = useState(DEFAULT_DAYS);
  const [mealPlan, setMealPlan] = useState<RecipeItem[] | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [recipesState, setRecipesState] = useState<RecipesState>({ status: "loading" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch category counts once on mount (non-blocking)
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cookbook/counts", { signal: controller.signal })
      .then((res) => res.json())
      .then((counts: Record<string, number>) => {
        setCategoryCounts(counts);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Fetch recipes: search takes priority over category selection
  useEffect(() => {
    const controller = new AbortController();

    // Search takes priority; otherwise fetch each selected category in parallel.
    const urls = debouncedQuery
      ? [`/api/cookbook/search?q=${encodeURIComponent(debouncedQuery)}`]
      : selectedCategories.map((catId) =>
          catId ? `/api/cookbook?category=${encodeURIComponent(catId)}` : "/api/cookbook"
        );

    Promise.all(urls.map((url) => fetch(url, { signal: controller.signal }).then((r) => r.json())))
      .then((results: (CookbookApiResponse & Partial<ApiErrorResponse>)[]) => {
        const failed = results.find((data) => "error" in data && data.error);
        if (failed?.error) {
          if (failed.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setRecipesState({ status: "error", message: failed.error });
          return;
        }

        const withCategories = results.find((data) => data.categories?.length);
        if (withCategories?.categories) setCategories(withCategories.categories);

        const seen = new Set<string>();
        const merged: RecipeItem[] = [];
        for (const data of results) {
          for (const recipe of Array.isArray(data.recipes) ? data.recipes : []) {
            if (!seen.has(recipe.id)) {
              seen.add(recipe.id);
              merged.push(recipe);
            }
          }
        }
        setRecipesState({ status: "success", recipes: merged });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRecipesState({ status: "error", message: t.cookbookLoadError });
      });

    return () => controller.abort();
  }, [debouncedQuery, selectedCategories, retryCount, t.cookbookLoadError]);

  const allRecipes = recipesState.status === "success" ? recipesState.recipes : EMPTY_RECIPES;
  const displayedRecipes = mealPlan ?? allRecipes;

  // Infinite scroll: reveal PAGE_SIZE more recipes when sentinel enters viewport
  useEffect(() => {
    if (displayedRecipes.length === 0) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, displayedRecipes.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayedRecipes]);

  const handleBack = useCallback(() => router.push("/"), [router]);

  const handleRetry = useCallback(() => {
    setMealPlan(null);
    setRecipesState({ status: "loading" });
    setVisibleCount(PAGE_SIZE);
    setRetryCount((c) => c + 1);
  }, []);

  const handleSelectCategories = useCallback((ids: (string | null)[]) => {
    setSelectedCategories(ids);
    setMealPlan(null);
    setRecipesState({ status: "loading" });
    setVisibleCount(PAGE_SIZE);
  }, []);

  const generatePlan = useCallback(() => {
    if (allRecipes.length === 0) return;
    const pool = [...allRecipes];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const plan: RecipeItem[] = [];
    for (let i = 0; i < daysCount; i++) {
      plan.push(pool[i % pool.length]);
    }
    setMealPlan(plan);
    setVisibleCount(PAGE_SIZE);
  }, [allRecipes, daysCount]);

  const checkboxOptions = [
    { id: null, name: t.cookbookFeatured, count: categoryCounts["__featured__"] },
    { id: "__saved__", name: t.cookbookSaved, count: categoryCounts["__saved__"] },
    ...categories.map((c) => ({
      id: c.id as string | null,
      name: c.name,
      count: categoryCounts[c.id],
    })),
  ];

  const visibleRecipes = displayedRecipes.slice(0, visibleCount);

  return (
    <SavedRecipesProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {/* Header row */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="text-text-muted hover:text-foreground shrink-0 text-sm transition-colors"
            >
              ← {t.backButton}
            </button>
            <h1 className="text-foreground text-xl font-bold">{t.cookbookTitle}</h1>
          </div>

          {/* Controls row */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <CategoryCheckboxPanel
                options={checkboxOptions}
                value={selectedCategories}
                onChange={handleSelectCategories}
                disabled={!!debouncedQuery}
                selectAllLabel={t.mealPlanSelectAll}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={daysCount}
                  onChange={(e) => {
                    setDaysCount(Math.max(1, Math.min(30, Number(e.target.value))));
                    setMealPlan(null);
                  }}
                  disabled={!!debouncedQuery}
                  className="focus:ring-picnic-red border-card-border bg-card-bg w-16 rounded-xl border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                />
                <span className="text-text-muted text-sm">{t.mealPlanDays}</span>
                <button
                  type="button"
                  onClick={generatePlan}
                  disabled={!!debouncedQuery || recipesState.status !== "success"}
                  className="hover:bg-picnic-red/90 bg-picnic-red rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t.mealPlanGenerate}
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-start">
              <RecipeSearchInput
                value={searchInput}
                placeholder={t.cookbookSearchPlaceholder}
                onChange={(val) => {
                  setSearchInput(val);
                  setMealPlan(null);
                  setRecipesState({ status: "loading" });
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>
          </div>

          {/* Content */}
          {recipesState.status === "loading" && <LoadingSpinner />}

          {recipesState.status === "error" && (
            <ErrorView message={recipesState.message} onRetry={handleRetry} />
          )}

          {recipesState.status === "success" && displayedRecipes.length === 0 && (
            <p className="text-text-muted text-sm">{t.noRecipes}</p>
          )}

          {recipesState.status === "success" && displayedRecipes.length > 0 && (
            <>
              {mealPlan && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-text-muted text-sm">
                    {t.mealPlanSummary.replace("{n}", String(mealPlan.length))}
                  </span>
                  <button
                    type="button"
                    onClick={generatePlan}
                    className="text-picnic-red text-sm font-medium hover:underline"
                  >
                    {t.mealPlanRegenerate}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {visibleRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              {visibleCount < displayedRecipes.length && (
                <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <CartToast message={toastMessage} onDismiss={dismissToast} />
    </SavedRecipesProvider>
  );
}
