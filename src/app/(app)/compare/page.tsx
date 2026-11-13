"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { useCompareList } from "@/hooks/use-compare-list";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import { formatComparisonPrice, formatPrice } from "@/lib/core/format-price";
import { buildImageUrl } from "@/lib/core/image-url";
import type { AllergenBadge, ApiErrorResponse, ProductDetail } from "@/lib/core/types";
import { clearCompareIds, removeCompareId } from "@/lib/product/compare-list";
import {
  cheapestPerUnitIndex,
  compareNutrition,
  nutritionHeadings,
} from "@/lib/product/compare-products";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; product: ProductDetail };

/**
 * Up to four products side by side: price, price per kg or litre, package size,
 * labels, allergens and the nutrition table per 100 g. The app compares one
 * product at a time; on a wide screen the web can line them up.
 */
export default function ComparePage() {
  const t = useTranslations();
  usePageTitle(t.compareTitle);
  const ids = useCompareList();
  const products = useComparedProducts(ids);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-bold">{t.compareTitle}</h1>
        {ids.length > 0 && (
          <button
            type="button"
            onClick={clearCompareIds}
            className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
          >
            {t.compareClear}
          </button>
        )}
      </div>

      {ids.length === 0 && <p className="text-gray-500">{t.compareEmpty}</p>}
      {ids.length === 1 && <p className="mb-4 text-gray-500">{t.compareAddMore}</p>}
      {ids.length > 0 && <CompareTable ids={ids} states={products} />}
    </main>
  );
}

/**
 * Loads the details of each compared product once, keeping the ones already
 * loaded. A product without an entry yet shows as loading.
 */
function useComparedProducts(ids: readonly string[]): Map<string, LoadState> {
  const [states, setStates] = useState<Map<string, LoadState>>(new Map());
  const requested = useRef(new Set<string>());

  useEffect(() => {
    for (const id of ids) {
      if (requested.current.has(id)) continue;
      requested.current.add(id);
      fetch(`/api/product/${encodeURIComponent(id)}`)
        .then((res) => res.json())
        .then((data: ProductDetail | ApiErrorResponse) => {
          if ("code" in data && data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          const state: LoadState =
            "error" in data ? { status: "error" } : { status: "loaded", product: data };
          setStates((current) => new Map(current).set(id, state));
        })
        .catch(() => {
          setStates((current) => new Map(current).set(id, { status: "error" }));
        });
    }
  }, [ids]);

  return states;
}

function CompareTable({ ids, states }: { ids: readonly string[]; states: Map<string, LoadState> }) {
  const t = useTranslations();
  const columns = ids.map((id) => ({
    id,
    state: states.get(id) ?? { status: "loading" as const },
  }));
  const loaded = columns.flatMap((column) =>
    column.state.status === "loaded" ? [column.state.product] : []
  );
  const productAt = (index: number): ProductDetail | null => {
    const state = columns[index].state;
    return state.status === "loaded" ? state.product : null;
  };

  // Highlights and nutrition consider the loaded products, in column order.
  const loadedIndexes = columns.flatMap((column, index) =>
    column.state.status === "loaded" ? [index] : []
  );
  const cheapestLoaded = cheapestPerUnitIndex(loaded);
  const cheapestColumn = cheapestLoaded === null ? null : loadedIndexes[cheapestLoaded];
  const nutrition = compareNutrition(
    columns.map((_, index) => productAt(index) ?? { nutritionRows: [] })
  );
  const headings = nutritionHeadings(
    columns.map((_, index) => productAt(index) ?? { nutritionRows: [] })
  );

  const row = (label: string, cell: (product: ProductDetail, index: number) => ReactNode) => (
    <tr className="border-card-border border-t align-top">
      <th scope="row" className="py-2 pr-4 text-left text-sm font-medium text-gray-500">
        {label}
      </th>
      {columns.map((column, index) => {
        const product = productAt(index);
        return (
          <td key={column.id} className="px-3 py-2 text-sm">
            {product ? cell(product, index) : null}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-collapse">
        <colgroup>
          <col className="w-36" />
          {columns.map((column) => (
            <col key={column.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td />
            {columns.map((column) => (
              <th key={column.id} scope="col" className="px-3 pb-3 text-left align-top font-normal">
                <ProductHeader id={column.id} state={column.state} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {row(t.compareRowPrice, (product) => (
            <span className="font-semibold">
              {formatPrice(product.displayPrice)}
              {product.originalPrice !== null && product.originalPrice > product.displayPrice && (
                <span className="text-price-original ml-1.5 font-normal line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </span>
          ))}
          {row(t.compareRowComparisonPrice, (product, index) =>
            product.comparisonPrice ? (
              <span className={index === cheapestColumn ? "text-text-bio-green font-semibold" : ""}>
                {formatComparisonPrice(
                  product.comparisonPrice.price,
                  product.comparisonPrice.unit,
                  t
                )}
                {index === cheapestColumn && " ✓"}
              </span>
            ) : (
              <span className="text-gray-400">–</span>
            )
          )}
          {row(t.compareRowUnitQuantity, (product) => product.unitQuantity || "–")}
          {row(t.compareRowLabels, (product) => (
            <BadgeList badges={product.labels} />
          ))}
          {row(t.compareRowContains, (product) => (
            <BadgeList badges={product.allergens.confirmed} />
          ))}
          {row(t.compareRowMayContain, (product) => (
            <BadgeList badges={product.allergens.mayContain} />
          ))}
          {nutrition.length > 0 && (
            <tr className="border-card-border border-t">
              <th scope="row" className="pt-4 pb-1 text-left text-sm font-semibold">
                {t.compareRowNutrition}
              </th>
              {columns.map((column, index) => (
                <td key={column.id} className="px-3 pt-4 pb-1 text-xs text-gray-500">
                  {headings[index]}
                </td>
              ))}
            </tr>
          )}
          {nutrition.map((nutritionRow) => (
            <tr key={nutritionRow.label} className="border-t border-gray-100">
              <th
                scope="row"
                className={`py-1 text-left text-sm font-normal ${nutritionRow.isCategory ? "" : "pl-3 text-gray-500"}`}
              >
                {nutritionRow.label}
              </th>
              {nutritionRow.values.map((value, index) => (
                <td key={columns[index].id} className="px-3 py-1 text-sm">
                  {value ?? <span className="text-gray-400">–</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductHeader({ id, state }: { id: string; state: LoadState }) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const product = state.status === "loaded" ? state.product : null;
  const imageId = product?.imageIds[0];

  return (
    <div className="flex flex-col gap-2">
      <Link href={`/product/${id}`} className="group flex flex-col gap-2">
        <div className="relative h-24 w-24">
          {imageId && (
            <Image
              src={buildImageUrl(imageId, countryCode)}
              alt={product?.name ?? ""}
              fill
              unoptimized
              className="object-contain"
            />
          )}
        </div>
        <span className="text-foreground text-sm font-medium group-hover:underline">
          {product?.name ?? (state.status === "error" ? t.compareLoadError : "…")}
        </span>
        {product?.brand && <span className="text-xs text-gray-500">{product.brand}</span>}
      </Link>
      <button
        type="button"
        onClick={() => removeCompareId(id)}
        className="self-start text-xs text-gray-500 hover:text-gray-800 hover:underline"
      >
        {t.compareRemove}
      </button>
    </div>
  );
}

function BadgeList({ badges }: { badges: Pick<AllergenBadge, "text">[] }) {
  if (badges.length === 0) return <span className="text-gray-400">–</span>;
  return (
    <ul className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <li key={badge.text} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
          {badge.text}
        </li>
      ))}
    </ul>
  );
}
