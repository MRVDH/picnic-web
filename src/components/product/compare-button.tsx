"use client";

import { useState } from "react";

import { useTranslations } from "@/contexts/country-context";
import { useCompareList } from "@/hooks/use-compare-list";
import { MAX_COMPARE_PRODUCTS, toggleCompareId } from "@/lib/product/compare-list";

/** Adds the product to the side-by-side comparison, or takes it out again. */
export function CompareButton({ productId }: { productId: string }) {
  const t = useTranslations();
  const ids = useCompareList();
  const [isFull, setIsFull] = useState(false);
  const isAdded = ids.includes(productId);

  return (
    <div>
      <button
        type="button"
        aria-pressed={isAdded}
        onClick={() => setIsFull(!toggleCompareId(productId))}
        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
          isAdded
            ? "border-gray-800 bg-gray-800 text-white"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        {isAdded ? `✓ ${t.compareAdded}` : t.compareAdd}
      </button>
      {isFull && !isAdded && (
        <p className="mt-1 text-sm text-gray-500" role="status">
          {t.compareFull.replace("{count}", String(MAX_COMPARE_PRODUCTS))}
        </p>
      )}
    </div>
  );
}
