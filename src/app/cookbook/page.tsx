"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { RecipeCard } from "@/components/recipe-card";
import { SharedHeader } from "@/components/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type {
  ApiErrorResponse,
  CookbookApiResponse,
  RecipeCategory,
  RecipeItem,
} from "@/lib/types";

const PAGE_SIZE = 24;

type RecipesState =
  | { status: "loading" }
  | { status: "success"; recipes: RecipeItem[] }
  | { status: "error"; message: string };

export default function CookbookPage() {
  const t = useTranslations();
  const router = useRouter();
  usePageTitle(t.cookbookTitle);

  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [recipesState, setRecipesState] = useState<RecipesState>({ status: "loading" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const url = selectedCategory
      ? `/api/cookbook?category=${encodeURIComponent(selectedCategory)}`
      : "/api/cookbook";

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: CookbookApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setRecipesState({ status: "error", message: data.error });
          return;
        }
        if (data.categories?.length) setCategories(data.categories);
        setRecipesState({
          status: "success",
          recipes: Array.isArray(data.recipes) ? data.recipes : [],
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRecipesState({ status: "error", message: t.cookbookLoadError });
      });

    return () => controller.abort();
  }, [selectedCategory, retryCount, t.cookbookLoadError]);

  // Infinite scroll: reveal PAGE_SIZE more recipes when sentinel enters viewport
  const allRecipes = recipesState.status === "success" ? recipesState.recipes : [];

  useEffect(() => {
    if (allRecipes.length === 0) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, allRecipes.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [allRecipes.length]);

  const handleBack = useCallback(() => router.push("/"), [router]);

  const handleRetry = useCallback(() => {
    setRecipesState({ status: "loading" });
    setVisibleCount(PAGE_SIZE);
    setRetryCount((c) => c + 1);
  }, []);

  const handleSelectCategory = useCallback((catId: string | null) => {
    setSelectedCategory(catId);
    setRecipesState({ status: "loading" });
    setVisibleCount(PAGE_SIZE);
  }, []);

  const visibleRecipes = allRecipes.slice(0, visibleCount);

  return (
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

        {/* Category filter bar */}
        {categories.length > 0 && (
          <div className="-mx-6 mb-6 overflow-x-auto px-6">
            <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
              <CategoryChip
                label={t.cookbookFeatured}
                active={selectedCategory === null}
                onClick={() => handleSelectCategory(null)}
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  active={selectedCategory === cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {recipesState.status === "loading" && <LoadingSpinner />}

        {recipesState.status === "error" && (
          <ErrorView message={recipesState.message} onRetry={handleRetry} />
        )}

        {recipesState.status === "success" && allRecipes.length === 0 && (
          <p className="text-text-muted text-sm">{t.noRecipes}</p>
        )}

        {recipesState.status === "success" && allRecipes.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {/* Sentinel div: when visible, triggers next batch */}
            {visibleCount < allRecipes.length && (
              <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
                <LoadingSpinner />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-picnic-red text-white"
          : "border border-gray-200 bg-white text-gray-800 hover:border-gray-400"
      }`}
    >
      {label}
    </button>
  );
}
