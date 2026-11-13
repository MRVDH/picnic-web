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

/**
 * A small compare toggle for a product card in a list. The card is a link, so
 * the click doesn't open the product.
 */
export function CompareToggle({ productId }: { productId: string }) {
  const t = useTranslations();
  const ids = useCompareList();
  const [isFull, setIsFull] = useState(false);
  const isAdded = ids.includes(productId);
  const fullText = t.compareFull.replace("{count}", String(MAX_COMPARE_PRODUCTS));

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsFull(!toggleCompareId(productId));
  };

  return (
    <button
      type="button"
      aria-pressed={isAdded}
      title={isFull && !isAdded ? fullText : undefined}
      onClick={toggle}
      className={`rounded-full border px-2 py-0.5 text-xs shadow-sm transition-colors ${
        isAdded
          ? "border-gray-800 bg-gray-800 text-white"
          : isFull
            ? "border-gray-300 bg-white text-gray-400"
            : "border-gray-300 bg-white/90 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {isAdded ? `✓ ${t.compareAdd}` : `+ ${t.compareAdd}`}
    </button>
  );
}
