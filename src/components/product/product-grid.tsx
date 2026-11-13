"use client";

import { useState } from "react";

import { ProductCard } from "@/components/product/product-card";
import { useTranslations } from "@/contexts/country-context";
import { unitLabel } from "@/lib/core/format-price";
import type { Product, SearchSection } from "@/lib/core/types";
import { buildSectionId } from "@/lib/core/types";
import {
  canSortByComparisonPrice,
  sortByComparisonPrice,
} from "@/lib/product/sort-by-comparison-price";

type ProductGridProps =
  | { sections: SearchSection[]; products?: never }
  | { products: Product[]; sections?: never };

type SortOrder = "relevance" | "comparison";

const GRID_CLASS = "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function ProductGrid(props: ProductGridProps) {
  const sections = props.sections && props.sections.length > 0 ? props.sections : null;
  const products = sections
    ? sections.flatMap((section) => section.products)
    : (props.products ?? []);
  const [sortOrder, setSortOrder] = useState<SortOrder>("relevance");
  const sortable = canSortByComparisonPrice(products);

  if (products.length === 0) return null;

  return (
    <div>
      {sortable && <SortToggle value={sortOrder} onChange={setSortOrder} />}
      {sortable && sortOrder === "comparison" ? (
        <ComparisonGrid products={products} />
      ) : sections ? (
        <SectionGrid sections={sections} />
      ) : (
        <div className={GRID_CLASS}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={`/product/${product.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionGrid({ sections }: { sections: SearchSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <section
          key={`${index}-${section.title}`}
          id={buildSectionId(index)}
          className="scroll-mt-36"
        >
          {section.title && (
            <h2 className="text-foreground mb-3 text-lg font-semibold">{section.title}</h2>
          )}
          <div className={GRID_CLASS}>
            {section.products.map((product) => (
              <ProductCard key={product.id} product={product} href={`/product/${product.id}`} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** All products once, per unit (kg, litre, piece), cheapest first. */
function ComparisonGrid({ products }: { products: Product[] }) {
  const t = useTranslations();
  const groups = sortByComparisonPrice(products);
  const showHeaders = groups.length > 1;

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.unit ?? "none"}>
          {showHeaders && (
            <h2 className="text-foreground mb-3 text-lg font-semibold">
              {group.unit
                ? t.comparisonUnitHeader.replace("{unit}", unitLabel(group.unit, t))
                : t.noComparisonPrice}
            </h2>
          )}
          <div className={GRID_CLASS}>
            {group.products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/product/${product.id}`}
                isCheapestPerUnit={
                  group.unit !== null &&
                  index === 0 &&
                  !product.isUnavailable &&
                  group.products.length > 1
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SortToggle({
  value,
  onChange,
}: {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}) {
  const t = useTranslations();
  const options: { value: SortOrder; label: string }[] = [
    { value: "relevance", label: t.sortRelevance },
    { value: "comparison", label: t.sortComparisonPrice },
  ];

  return (
    <div className="mb-4 flex items-center gap-2 text-sm" role="group" aria-label={t.sortByLabel}>
      <span className="text-gray-500">{t.sortByLabel}:</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1 transition-colors ${
            value === option.value
              ? "border-gray-800 bg-gray-800 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
