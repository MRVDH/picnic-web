"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CartToast } from "@/components/cart/cart-toast";
import { ProductGrid } from "@/components/product/product-grid";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { usePublishHeaderSections } from "@/contexts/header-sections-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type {
  ApiErrorResponse,
  FavoritesAisle,
  FavoritesAisleApiResponse,
  FavoritesApiResponse,
  Product,
  SearchSection,
} from "@/lib/core/types";
import { buildSectionId } from "@/lib/core/types";

/** An aisle's full list, loaded from /api/favorites/<aisleId>. */
type AisleLoadState =
  | { status: "loading" }
  | { status: "success"; products: Product[] }
  | { status: "error" };

/**
 * The app's "Favorieten" tab: the products the customer buys, per aisle. The
 * page shows part of a long aisle ("Toon alles" loads the rest) and leaves the
 * last aisles empty; those load when they scroll into view, like in the app.
 */
export default function FavoritesPage() {
  const t = useTranslations();
  usePageTitle(t.favoritesTitle);
  const { state, retry } = useApiResource<FavoritesApiResponse>(
    "/api/favorites",
    t.favoritesLoadError
  );
  const [fullAisles, setFullAisles] = useState<Map<string, AisleLoadState>>(new Map());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const loadAisle = useCallback((aisleId: string) => {
    setFullAisles((current) => new Map(current).set(aisleId, { status: "loading" }));
    const setAisle = (aisleState: AisleLoadState) =>
      setFullAisles((current) => new Map(current).set(aisleId, aisleState));

    fetch(`/api/favorites/${encodeURIComponent(aisleId)}`)
      .then((res) => res.json())
      .then((data: FavoritesAisleApiResponse & Partial<ApiErrorResponse>) => {
        if (data.code === "TOKEN_EXPIRED") {
          window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        setAisle(data.error ? { status: "error" } : { status: "success", products: data.products });
      })
      .catch(() => setAisle({ status: "error" }));
  }, []);

  // Aisles the page sent without products and without the rest to load have nothing to show.
  const aisles = useMemo(
    () =>
      state.status === "success"
        ? state.data.aisles.filter((aisle) => aisle.products.length > 0 || !aisle.complete)
        : null,
    [state]
  );
  const headerSections = useMemo<SearchSection[]>(
    () => (aisles ?? []).map((aisle) => ({ title: aisle.title, products: aisle.products })),
    [aisles]
  );
  usePublishHeaderSections(headerSections);

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <h1 className="text-foreground mb-6 text-2xl font-bold">{t.favoritesTitle}</h1>
          {state.status === "loading" && <LoadingSpinner />}
          {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
          {aisles && aisles.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">{t.favoritesEmpty}</p>
          )}
          {aisles && aisles.length > 0 && (
            <div className="space-y-8">
              {aisles.map((aisle, index) => (
                <AisleSection
                  key={aisle.id}
                  aisle={aisle}
                  index={index}
                  full={fullAisles.get(aisle.id)}
                  onLoad={loadAisle}
                />
              ))}
            </div>
          )}
        </main>
        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}

type AisleSectionProps = {
  aisle: FavoritesAisle;
  index: number;
  full: AisleLoadState | undefined;
  onLoad: (aisleId: string) => void;
};

function AisleSection({ aisle, index, full, onLoad }: AisleSectionProps) {
  const t = useTranslations();
  const products = full?.status === "success" ? full.products : aisle.products;
  const canLoadMore = !aisle.complete && full?.status !== "success";

  return (
    <section id={buildSectionId(index)} className="scroll-mt-36">
      <h2 className="text-foreground mb-3 text-lg font-semibold">{aisle.title}</h2>
      {products.length > 0 && <ProductGrid products={products} />}
      {full?.status === "success" && products.length === 0 && (
        <p className="text-sm text-gray-500">{t.noProductsInCategory}</p>
      )}
      {full?.status === "loading" && <LoadingSpinner />}
      {full?.status === "error" && (
        <ErrorView message={t.productsLoadError} onRetry={() => onLoad(aisle.id)} />
      )}
      {canLoadMore && !full && aisle.products.length === 0 && (
        <LoadWhenVisible onVisible={() => onLoad(aisle.id)} />
      )}
      {canLoadMore && !full && aisle.products.length > 0 && (
        <button
          type="button"
          onClick={() => onLoad(aisle.id)}
          className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
        >
          {t.favoritesShowAll}
        </button>
      )}
    </section>
  );
}

/** Calls `onVisible` once, when it scrolls near the viewport. */
function LoadWhenVisible({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          onVisibleRef.current();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <LoadingSpinner />
    </div>
  );
}
