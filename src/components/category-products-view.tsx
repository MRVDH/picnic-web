"use client";

import { ProductGrid } from "@/components/product-grid";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorView } from "@/components/error-view";
import { BackArrowIcon } from "@/components/back-arrow-icon";
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
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
      >
        <BackArrowIcon />
        Terug
      </button>

      <h2 className="mb-3 text-lg font-semibold text-foreground">
        {categoryName}
      </h2>

      {(state.status === "loading" || state.status === "idle") && (
        <LoadingSpinner />
      )}
      {state.status === "error" && (
        <div>
          <ErrorView message={state.message} />
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
          >
            Opnieuw proberen
          </button>
        </div>
      )}
      {state.status === "success" && state.products.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          Geen producten gevonden in deze categorie.
        </p>
      )}
      {state.status === "success" && state.products.length > 0 && (
        <div>
          <p className="mb-4 text-sm text-gray-500">
            {state.products.length}{" "}
            {state.products.length === 1 ? "product" : "producten"}
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
