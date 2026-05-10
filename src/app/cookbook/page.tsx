"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { RecipeCard } from "@/components/recipe-card";
import { SharedHeader } from "@/components/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse, CookbookApiResponse, RecipeItem } from "@/lib/types";

type CookbookState =
  | { status: "loading" }
  | { status: "success"; recipes: RecipeItem[] }
  | { status: "error"; message: string };

export default function CookbookPage() {
  const t = useTranslations();
  const router = useRouter();
  usePageTitle(t.cookbookTitle);

  const [state, setState] = useState<CookbookState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/cookbook", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: CookbookApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setState({ status: "error", message: data.error });
          return;
        }
        setState({
          status: "success",
          recipes: Array.isArray(data.recipes) ? data.recipes : [],
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", message: t.cookbookLoadError });
      });

    return () => controller.abort();
  }, [retryCount, t.cookbookLoadError]);

  const handleBack = useCallback(() => router.push("/"), [router]);
  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-text-muted hover:text-foreground text-sm transition-colors"
          >
            ← {t.backButton}
          </button>
          <h1 className="text-foreground text-xl font-bold">{t.cookbookTitle}</h1>
        </div>

        {state.status === "loading" && <LoadingSpinner />}

        {state.status === "error" && (
          <ErrorView message={state.message} onRetry={handleRetry} />
        )}

        {state.status === "success" && state.recipes.length === 0 && (
          <p className="text-text-muted text-sm">{t.noRecipes}</p>
        )}

        {state.status === "success" && state.recipes.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {state.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
