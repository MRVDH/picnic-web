"use client";

import { ProductGrid } from "@/components/product-grid";
import { useTranslations } from "@/contexts/country-context";
import type { Product, SearchSection } from "@/lib/types";

type ResultsViewProps = {
  query: string;
  products: Product[];
  sections: SearchSection[];
};

export function ResultsView({ query, products, sections }: ResultsViewProps) {
  const t = useTranslations();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-gray-600">
          {t.noResultsFor} &ldquo;{query}&rdquo;
        </p>
        <p className="mt-1 text-sm text-gray-400">{t.tryAnotherTerm}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {products.length} {products.length === 1 ? t.resultSingular : t.resultPlural} {t.resultFor} &ldquo;
        {query}
        &rdquo;
      </p>
      {sections.length > 0 ? (
        <ProductGrid sections={sections} />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
