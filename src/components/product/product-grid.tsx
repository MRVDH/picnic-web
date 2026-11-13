"use client";

import { useSyncExternalStore } from "react";

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

/** The sort order is a per-browser preference, so it carries over between lists. */
const SORT_STORAGE_KEY = "picnic-web:product-sort";
const GRID_CLASS = "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function ProductGrid(props: ProductGridProps) {
  const sections = props.sections && props.sections.length > 0 ? props.sections : null;
  const products = sections
    ? sections.flatMap((section) => section.products)
    : (props.products ?? []);
  const [sortOrder, setSortOrder] = useSortOrder();
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
                isCheapestPerUnit={group.unit !== null && index === 0 && group.products.length > 1}
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

/** Lists showing a grid re-render when the sort order changes. */
const sortListeners = new Set<() => void>();
/** The order when localStorage is blocked: kept for this page load. */
let memorySortOrder: SortOrder = "relevance";

function readSortOrder(): SortOrder {
  try {
    return window.localStorage.getItem(SORT_STORAGE_KEY) === "comparison"
      ? "comparison"
      : "relevance";
  } catch {
    return memorySortOrder;
  }
}

function writeSortOrder(value: SortOrder) {
  memorySortOrder = value;
  try {
    window.localStorage.setItem(SORT_STORAGE_KEY, value);
  } catch {
    // Storage can be blocked; the choice then lasts until the page reloads.
  }
  sortListeners.forEach((listener) => listener());
}

function subscribeToSortOrder(listener: () => void) {
  sortListeners.add(listener);
  return () => {
    sortListeners.delete(listener);
  };
}

/** The sort order, shared by every grid and remembered in localStorage when the browser allows it. */
function useSortOrder(): [SortOrder, (value: SortOrder) => void] {
  const sortOrder = useSyncExternalStore<SortOrder>(
    subscribeToSortOrder,
    readSortOrder,
    () => "relevance"
  );
  return [sortOrder, writeSortOrder];
}
