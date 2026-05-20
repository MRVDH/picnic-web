"use client";

import { BackArrowIcon } from "@/components/back-arrow-icon";
import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ProductGrid } from "@/components/product-grid";
import { useTranslations } from "@/contexts/country-context";
import type { Product, SearchSection } from "@/lib/types";

export type CategoryProductsState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      title: string;
      products: Product[];
      sections: SearchSection[];
    }
  | { status: "error"; message: string };

type CategoryProductsViewProps = {
  categoryName: string;
  state: CategoryProductsState;
  onBack: () => void;
  onRetry: () => void;
};

export function CategoryProductsView({
  categoryName,
  state,
  onBack,
  onRetry,
}: CategoryProductsViewProps) {
  const t = useTranslations();
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
      >
        <BackArrowIcon />
        {t.backButton}
      </button>

      <h2 className="text-foreground mb-3 text-lg font-semibold">{categoryName}</h2>

      {(state.status === "loading" || state.status === "idle") && <LoadingSpinner />}
      {state.status === "error" && (
        <div>
          <ErrorView message={state.message} />
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
          >
            {t.retryLabel}
          </button>
        </div>
      )}
      {state.status === "success" && state.products.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">{t.noProductsInCategory}</p>
      )}
      {state.status === "success" && state.products.length > 0 && (
        <div>
          <p className="mb-4 text-sm text-gray-500">
            {state.products.length}{" "}
            {state.products.length === 1 ? t.productSingular : t.productPlural}
          </p>
          {state.sections.length > 0 ? (
            <ProductGrid sections={state.sections} />
          ) : (
            <ProductGrid products={state.products} />
          )}
        </div>
      )}
    </div>
  );
}
