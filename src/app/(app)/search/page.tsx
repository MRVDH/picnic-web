"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { CartToast } from "@/components/cart/cart-toast";
import { RscPageView } from "@/components/rsc/rsc-page-view";
import { ResultsView } from "@/components/search/results-view";
import { SearchBar } from "@/components/search/search-bar";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { usePublishHeaderSections } from "@/contexts/header-sections-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { ApiErrorResponse, Product, SearchApiResponse, SearchSection } from "@/lib/core/types";
import type { RscPageModel } from "@/lib/rsc/rsc-page-types";

/** The page the Picnic app shows on its search tab before anything is typed. */
const CATEGORY_TREE_PAGE_ID = "category-tree-root";

type SearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | {
      status: "success";
      query: string;
      products: Product[];
      sections: SearchSection[];
    }
  | { status: "error"; query: string; message: string };

type CategoriesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; page: RscPageModel }
  | { status: "error"; message: string };

export default function SearchRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("q") ?? "";

  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });

  const [categoriesState, setCategoriesState] = useState<CategoriesState>({
    status: "idle",
  });

  const titleContext = searchState.status !== "idle" ? `"${searchState.query}"` : undefined;
  usePageTitle(titleContext);
  usePublishHeaderSections(searchState.status === "success" ? searchState.sections : []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (trimmed === "") {
        setSearchState({ status: "idle" });
        router.push("/search");
        return;
      }

      // Only push when the URL doesn't already carry this query —
      // avoids a redundant navigation that can cause useSearchParams
      // to transiently return stale/empty values during the transition.
      const currentQ = new URLSearchParams(window.location.search).get("q") ?? "";
      if (currentQ !== trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
      setSearchState({ status: "loading", query: trimmed });

      try {
        const url = `/api/search?q=${encodeURIComponent(trimmed)}`;
        const response = await fetch(url);
        const data: SearchApiResponse | ApiErrorResponse = await response.json();

        if ("error" in data) {
          if ("code" in data && data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setSearchState({ status: "error", query: trimmed, message: data.error });
          return;
        }

        setSearchState({
          status: "success",
          query: trimmed,
          products: data.products,
          sections: data.sections,
        });
      } catch {
        setSearchState({
          status: "error",
          query: trimmed,
          message: t.searchError,
        });
      }
    },
    [router, t.searchError]
  );

  // Auto-search when the page loads with ?q= or when URL changes (back/forward)
  useEffect(() => {
    if (urlQuery) {
      handleSearch(urlQuery);
    } else {
      setSearchState({ status: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  // Fetch categories when in idle state (no search query active)
  useEffect(() => {
    if (searchState.status !== "idle") return;
    if (categoriesState.status !== "idle") return;

    setCategoriesState({ status: "loading" });

    fetch(`/api/rsc-pages?pageId=${CATEGORY_TREE_PAGE_ID}`)
      .then((res) => res.json())
      .then((data: RscPageModel & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setCategoriesState({ status: "error", message: data.error });
          return;
        }
        setCategoriesState({ status: "success", page: data });
      })
      .catch(() => {
        setCategoriesState({
          status: "error",
          message: t.categoriesLoadError,
        });
      });
  }, [searchState.status, categoriesState.status, t.categoriesLoadError]);

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <div className="mb-8">
            <SearchBar
              key={urlQuery}
              onSearch={handleSearch}
              isLoading={searchState.status === "loading"}
              initialQuery={urlQuery}
            />
          </div>

          {searchState.status === "idle" && <CategoryBrowser categoriesState={categoriesState} />}
          {searchState.status === "loading" && <LoadingSpinner />}
          {searchState.status === "error" && <ErrorView message={searchState.message} />}
          {searchState.status === "success" && (
            <ResultsView
              query={searchState.query}
              products={searchState.products}
              sections={searchState.sections}
            />
          )}
        </main>

        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}

// ─── Category browser sub-view ───────────────────────────────────────────────

function CategoryBrowser({ categoriesState }: { categoriesState: CategoriesState }) {
  if (categoriesState.status === "loading") return <LoadingSpinner />;
  if (categoriesState.status === "error") {
    return <ErrorView message={categoriesState.message} />;
  }
  if (categoriesState.status !== "success") return null;

  return <RscPageView page={categoriesState.page} />;
}
