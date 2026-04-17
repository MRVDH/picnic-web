"use client";

import { ProductGrid } from "@/components/product-grid";
import type { Product, SearchSection } from "@/lib/types";

type ResultsViewProps = {
  query: string;
  products: Product[];
  sections: SearchSection[];
};

export function ResultsView({ query, products, sections }: ResultsViewProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-gray-600">
          Geen resultaten gevonden voor &ldquo;{query}&rdquo;
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Probeer een andere zoekterm
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {products.length} {products.length === 1 ? "resultaat" : "resultaten"}{" "}
        voor &ldquo;{query}&rdquo;
      </p>
      {sections.length > 0 ? (
        <ProductGrid sections={sections} />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
