"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { CartToast } from "@/components/cart-toast";
import { CategoryGrid } from "@/components/category-grid";
import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ResultsView } from "@/components/results-view";
import { SectionNavBar } from "@/components/section-nav-bar";
import { SharedHeader } from "@/components/shared-header";
import { ShortcutList } from "@/components/shortcut-list";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CategoryItem, ShortcutItem } from "@/lib/category-types";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import { parsePageIdFromDeepLink } from "@/lib/parse-deep-link";
import type { ApiErrorResponse, Product, SearchApiResponse, SearchSection } from "@/lib/types";

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
  | { status: "success"; categories: CategoryItem[]; shortcuts: ShortcutItem[] }
  | { status: "error"; message: string };

export default function Home() {
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (trimmed === "") {
        setSearchState({ status: "idle" });
        router.push("/");
        return;
      }

      // Only push when the URL doesn't already carry this query —
      // avoids a redundant navigation that can cause useSearchParams
      // to transiently return stale/empty values during the transition.
      const currentQ = new URLSearchParams(window.location.search).get("q") ?? "";
      if (currentQ !== trimmed) {
        router.push(`/?q=${encodeURIComponent(trimmed)}`);
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

    fetch("/api/categories")
      .then((res) => res.json())
      .then(
        (
          data: {
            categories?: CategoryItem[];
            shortcuts?: ShortcutItem[];
          } & Partial<ApiErrorResponse>
        ) => {
          if ("error" in data && data.error) {
            if (data.code === "TOKEN_EXPIRED") {
              window.location.href = TOKEN_EXPIRED_REDIRECT;
              return;
            }
            setCategoriesState({ status: "error", message: data.error });
            return;
          }
          const categories = Array.isArray(data.categories) ? data.categories : [];
          const shortcuts = Array.isArray(data.shortcuts) ? data.shortcuts : [];
          setCategoriesState({ status: "success", categories, shortcuts });
        }
      )
      .catch(() => {
        setCategoriesState({
          status: "error",
          message: t.categoriesLoadError,
        });
      });
  }, [searchState.status, categoriesState.status, t.categoriesLoadError]);

  const handleCategoryTap = useCallback(
    (category: CategoryItem) => {
      router.push(`/categories/${encodeURIComponent(category.id)}`);
    },
    [router]
  );

  const handleShortcutTap = useCallback(
    (shortcut: ShortcutItem) => {
      const pageId = parsePageIdFromDeepLink(shortcut.deepLinkTarget);
      if (!pageId) {
        return;
      }
      const params = new URLSearchParams({ pageId, title: shortcut.name });
      router.push(`/pages?${params.toString()}`);
    },
    [router]
  );

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader
          bottomBar={
            searchState.status === "success" && searchState.sections.length > 0 ? (
              <SectionNavBar sections={searchState.sections} />
            ) : undefined
          }
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {searchState.status === "idle" && (
            <CategoryBrowser
              categoriesState={categoriesState}
              onCategoryTap={handleCategoryTap}
              onShortcutTap={handleShortcutTap}
            />
          )}
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

type CategoryBrowserProps = {
  categoriesState: CategoriesState;
  onCategoryTap: (category: CategoryItem) => void;
  onShortcutTap: (shortcut: ShortcutItem) => void;
};

function CategoryBrowser({ categoriesState, onCategoryTap, onShortcutTap }: CategoryBrowserProps) {
  if (categoriesState.status === "loading") return <LoadingSpinner />;
  if (categoriesState.status === "error") {
    return <ErrorView message={categoriesState.message} />;
  }
  if (categoriesState.status !== "success") return null;

  return (
    <>
      <ShortcutList shortcuts={categoriesState.shortcuts} onShortcutTap={onShortcutTap} />
      <CategoryGrid categories={categoriesState.categories} onCategoryTap={onCategoryTap} />
    </>
  );
}
