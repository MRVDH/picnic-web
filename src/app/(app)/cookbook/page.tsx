"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { CartToast } from "@/components/cart/cart-toast";
import { PlanRecipeCard } from "@/components/meal-plan/plan-recipe-card";
import { ShoppingListModal } from "@/components/meal-plan/shopping-list-modal";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { RecipeSearchInput } from "@/components/recipe/recipe-search-input";
import { Button } from "@/components/ui/button";
import { CategoryCheckboxPanel } from "@/components/ui/category-checkbox-panel";
import { Chip } from "@/components/ui/chip";
import { ErrorView } from "@/components/ui/error-view";
import { IndeterminateCheckbox } from "@/components/ui/indeterminate-checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { SavedRecipesProvider } from "@/contexts/saved-recipes-context";
import {
  clearMealPlanCache,
  useMealPlanCache,
  writeMealPlanCache,
} from "@/hooks/use-meal-plan-cache";
import type { MealPlanCacheEntry } from "@/hooks/use-meal-plan-cache";
import { usePageTitle } from "@/hooks/use-page-title";
import { MEAL_PLAN_MAX_CANDIDATES, TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import { DEBOUNCE_DELAY_MS } from "@/lib/core/types";
import type {
  ApiErrorResponse,
  CookbookApiResponse,
  MealPlanSearchRequest,
  MealPlanSearchResponse,
  RecipeItem,
} from "@/lib/core/types";

const PAGE_SIZE = 24;
const DEFAULT_DAYS = 7;
const DEFAULT_PEOPLE = 2;

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
  const [peopleCount, setPeopleCount] = useState(DEFAULT_PEOPLE);
  const [mealPlan, setMealPlan] = useState<RecipeItem[] | null>(null);
  // True while the grid shows the plan restored from the cache, i.e. while the
  // "recent meal plan" chip is in its selected state.
  const [recentPlanOpen, setRecentPlanOpen] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [recipesState, setRecipesState] = useState<RecipesState>({ status: "loading" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cachedPlan = useMealPlanCache();

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

  const handleBack = useCallback(() => router.push("/search"), [router]);

  const handleRetry = useCallback(() => {
    setMealPlan(null);
    setRecentPlanOpen(false);
    setRecipesState({ status: "loading" });
    setVisibleCount(PAGE_SIZE);
    setRetryCount((c) => c + 1);
  }, []);

  const handleSelectCategories = useCallback((ids: (string | null)[]) => {
    setSelectedCategories(ids);
    setMealPlan(null);
    setRecentPlanOpen(false);
    setConfirmedIds(new Set());
    setRecipesState({ status: "loading" });
    setVisibleCount(PAGE_SIZE);
  }, []);

  const runSearch = useCallback(
    async (fixedRecipes: RecipeItem[], days = daysCount, people = peopleCount) => {
      if (allRecipes.length === 0) return;
      const slots = days - fixedRecipes.length;
      if (slots < 1) return;

      // Fresh random subset each call, capped at MEAL_PLAN_MAX_CANDIDATES — fetching more
      // would mean 40+ Picnic page requests per click. Excludes recipes already fixed
      // (confirmed) since those are never candidates for replacement.
      function sampleCandidates(excludeIds: Set<string>): RecipeItem[] {
        const shuffled = allRecipes.filter((r) => !excludeIds.has(r.id));
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, MEAL_PLAN_MAX_CANDIDATES);
      }

      setPlanLoading(true);
      setPlanError(null);

      const fixedIdSet = new Set(fixedRecipes.map((r) => r.id));
      const candidatePool = sampleCandidates(fixedIdSet);

      try {
        const requestBody: MealPlanSearchRequest = {
          candidateIds: candidatePool.map((r) => r.id),
          fixedIds: fixedRecipes.map((r) => r.id),
          slots,
          people,
        };
        const res = await fetch("/api/meal-plan/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const data: MealPlanSearchResponse & Partial<ApiErrorResponse> = await res.json();
        if (!res.ok || "error" in data) {
          if ("code" in data && data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setPlanError(t.mealPlanGenerateError);
          return;
        }

        const best = data.combinations[0];
        const pickedIds = best ? best.recipeIds : [];
        const byId = new Map(allRecipes.map((r) => [r.id, r]));
        const picked = pickedIds
          .map((id) => byId.get(id))
          .filter((r): r is RecipeItem => r !== undefined);
        const nextPlan = [...fixedRecipes, ...picked];

        setMealPlan(nextPlan);
        setConfirmedIds(fixedIdSet);
        setVisibleCount(PAGE_SIZE);
        if (nextPlan.length < days) {
          setToastMessage(
            t.mealPlanNotEnoughRecipes
              .replace("{available}", String(nextPlan.length))
              .replace("{requested}", String(days))
          );
        }
      } catch {
        setPlanError(t.mealPlanGenerateError);
      } finally {
        setPlanLoading(false);
      }
    },
    [allRecipes, daysCount, peopleCount, t.mealPlanGenerateError, t.mealPlanNotEnoughRecipes]
  );

  /** Restores the cached plan and puts the chip into its selected state. */
  const openRecentPlan = useCallback((entry: MealPlanCacheEntry) => {
    setDaysCount(entry.days);
    setPeopleCount(entry.people);
    setMealPlan(entry.recipes);
    setConfirmedIds(new Set(entry.recipes.map((r) => r.id)));
    setRecentPlanOpen(true);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleContinuePlanning = useCallback(() => {
    // The button reads "continue planning" whenever a saved plan exists, so with
    // the chip still unselected it selects it first and continues from there.
    // The cached day/people counts go to runSearch directly — setState has not
    // applied them yet at this point. A plan already on screen is continued as
    // it is, so restoring the cache never discards it.
    if (cachedPlan && !recentPlanOpen && !mealPlan) {
      openRecentPlan(cachedPlan);
      void runSearch(cachedPlan.recipes, cachedPlan.days, cachedPlan.people);
      return;
    }
    const fixedRecipes = (mealPlan ?? []).filter((r) => confirmedIds.has(r.id));
    // Keeping nothing builds a plan from scratch, so it is no longer the saved one.
    if (fixedRecipes.length === 0) setRecentPlanOpen(false);
    void runSearch(fixedRecipes);
  }, [cachedPlan, recentPlanOpen, openRecentPlan, mealPlan, confirmedIds, runSearch]);

  /** Master checkbox above the grid: all confirmed → none, otherwise → all. */
  const toggleAllConfirmed = useCallback(() => {
    setConfirmedIds((prev) => {
      const plan = mealPlan ?? [];
      const allOn = plan.length > 0 && plan.every((r) => prev.has(r.id));
      return allOn ? new Set<string>() : new Set(plan.map((r) => r.id));
    });
  }, [mealPlan]);

  const toggleConfirmed = useCallback((recipeId: string) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  }, []);

  // Auto-save whenever the confirmed set changes. Never auto-clears when it becomes
  // empty — only the explicit "Clear plan" action (handleClearPlan below) does that.
  useEffect(() => {
    if (!mealPlan) return;
    const confirmedRecipes = mealPlan.filter((r) => confirmedIds.has(r.id));
    if (confirmedRecipes.length === 0) return;
    writeMealPlanCache({ recipes: confirmedRecipes, days: daysCount, people: peopleCount });
  }, [mealPlan, confirmedIds, daysCount, peopleCount]);

  /** Chip body: opens the cached plan, or leaves it again when already open. */
  const handleToggleRecent = useCallback(() => {
    if (recentPlanOpen) {
      setMealPlan(null);
      setConfirmedIds(new Set());
      setRecentPlanOpen(false);
      setVisibleCount(PAGE_SIZE);
      return;
    }
    if (cachedPlan) openRecentPlan(cachedPlan);
  }, [cachedPlan, recentPlanOpen, openRecentPlan]);

  /** Chip delete icon: drops the cached plan, and the view of it if it is open. */
  const handleClearPlan = useCallback(() => {
    clearMealPlanCache();
    setConfirmedIds(new Set());
    if (recentPlanOpen) {
      setMealPlan(null);
      setRecentPlanOpen(false);
      setVisibleCount(PAGE_SIZE);
    }
  }, [recentPlanOpen]);

  // Continuing needs at least one free slot: a day count above the number of
  // recipes kept. Lowering the day count below that count disables it again.
  const continueDisabled =
    !!debouncedQuery ||
    recipesState.status !== "success" ||
    planLoading ||
    confirmedIds.size >= daysCount;

  const checkboxOptions = [
    { id: null, name: t.cookbookFeatured, count: categoryCounts["__featured__"] },
    { id: "__saved__", name: t.cookbookSaved, count: categoryCounts["__saved__"] },
    ...categories.map((c) => ({
      id: c.id as string | null,
      name: c.name,
      count: categoryCounts[c.id],
    })),
  ];

  const confirmedInPlan = mealPlan ? mealPlan.filter((r) => confirmedIds.has(r.id)).length : 0;
  const allConfirmed = !!mealPlan && mealPlan.length > 0 && confirmedInPlan === mealPlan.length;
  const someConfirmed = confirmedInPlan > 0 && !allConfirmed;

  const visibleRecipes = displayedRecipes.slice(0, visibleCount);
  const planRecipeIds = useMemo(() => (mealPlan ? mealPlan.map((r) => r.id) : []), [mealPlan]);

  return (
    <SavedRecipesProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
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
                  onChange={(e) => setDaysCount(Math.max(1, Math.min(30, Number(e.target.value))))}
                  disabled={!!debouncedQuery}
                  className="focus:ring-picnic-red border-card-border bg-card-bg h-8 w-14 rounded-full border px-3 text-sm shadow-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                />
                <span className="text-text-muted text-sm">{t.mealPlanDays}</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={peopleCount}
                  onChange={(e) =>
                    setPeopleCount(Math.max(1, Math.min(12, Number(e.target.value))))
                  }
                  disabled={!!debouncedQuery}
                  className="focus:ring-picnic-red border-card-border bg-card-bg h-8 w-14 rounded-full border px-3 text-sm shadow-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                />
                <span className="text-text-muted text-sm">{t.mealPlanPeople}</span>
                <Button
                  type="button"
                  onClick={handleContinuePlanning}
                  loading={planLoading}
                  disabled={continueDisabled}
                  title={continueDisabled ? t.mealPlanContinueDisabledHint : undefined}
                >
                  {cachedPlan ? t.mealPlanContinue : t.mealPlanGenerate}
                </Button>
                {cachedPlan && (
                  <Chip
                    label={t.mealPlanRecent}
                    selected={recentPlanOpen}
                    onClick={handleToggleRecent}
                    onDelete={handleClearPlan}
                    deleteLabel={t.mealPlanClear}
                    disabled={planLoading}
                  />
                )}
              </div>
              {planError && <p className="text-sm text-red-600">{planError}</p>}
            </div>
            <div className="flex flex-1 items-start">
              <RecipeSearchInput
                value={searchInput}
                placeholder={t.cookbookSearchPlaceholder}
                onChange={(val) => {
                  setSearchInput(val);
                  setMealPlan(null);
                  setRecentPlanOpen(false);
                  setConfirmedIds(new Set());
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
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-text-muted mr-1 text-sm">
                    {t.mealPlanSummary.replace("{n}", String(mealPlan.length))}
                  </span>
                  <label className="text-text-muted mr-1 flex cursor-pointer items-center gap-2 text-sm select-none">
                    <IndeterminateCheckbox
                      checked={allConfirmed}
                      indeterminate={someConfirmed}
                      onChange={toggleAllConfirmed}
                      disabled={planLoading}
                      className="disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    {t.mealPlanSelectAllRecipes}
                  </label>
                  <Button type="button" onClick={() => setShoppingListOpen(true)}>
                    {t.mealPlanViewShoppingList}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {visibleRecipes.map((recipe) =>
                  mealPlan ? (
                    <PlanRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      confirmed={confirmedIds.has(recipe.id)}
                      onToggleConfirmed={toggleConfirmed}
                      disabled={planLoading}
                    />
                  ) : (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  )
                )}
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
      {shoppingListOpen && mealPlan && (
        <CartProvider showToast={setToastMessage}>
          <ShoppingListModal
            recipeIds={planRecipeIds}
            people={peopleCount}
            onClose={() => setShoppingListOpen(false)}
          />
        </CartProvider>
      )}
    </SavedRecipesProvider>
  );
}
