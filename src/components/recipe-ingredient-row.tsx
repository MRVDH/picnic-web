"use client";

import { useState } from "react";

import Image from "next/image";

import { useCountryCode } from "@/contexts/country-context";
import { buildImageUrl } from "@/lib/image-url";
import { formatEuroPrice } from "@/lib/format-price";
import type { RecipeIngredient } from "@/lib/types";

const PLACEHOLDER = "/placeholder-product.svg";

function scaleNeededText(text: string, portions: number, basePortion: number): string {
  if (basePortion === 0) return text;
  const m = /^\((\d+(?:[.,]\d+)?)\s+(.+)\)$/.exec(text);
  if (!m) return text;
  const num = parseFloat(m[1].replace(",", "."));
  const scaled = (num * portions) / basePortion;
  const scaledStr = Number.isInteger(scaled)
    ? String(scaled)
    : scaled.toFixed(1).replace(".", ",");
  return `(${scaledStr} ${m[2]})`;
}

type RecipeIngredientRowProps = {
  ingredient: RecipeIngredient;
  qty: number;
  portions: number;
  basePortion: number;
  checked: boolean;
  onToggle: () => void;
};

export function RecipeIngredientRow({
  ingredient,
  qty,
  portions,
  basePortion,
  checked,
  onToggle,
}: RecipeIngredientRowProps) {
  const countryCode = useCountryCode();
  const [imgSrc, setImgSrc] = useState(
    ingredient.imageId ? buildImageUrl(ingredient.imageId, countryCode) : PLACEHOLDER
  );

  const scaledNeeded = ingredient.recipeQuantityText
    ? scaleNeededText(ingredient.recipeQuantityText, portions, basePortion)
    : null;

  const displayPkg = ingredient.recipePackageSize ?? ingredient.unitQuantity;
  const packageLabel = qty > 1 ? `${qty} × ${displayPkg}` : displayPkg;
  const subtitle = scaledNeeded ? `${packageLabel} ${scaledNeeded}` : packageLabel;

  const bundleTier = ingredient.priceRanges?.filter((t) => t.quantity <= qty).at(-1);
  const effectiveUnitPrice = bundleTier ? bundleTier.pricePerUnit : ingredient.displayPrice;
  const totalPrice = effectiveUnitPrice * qty;

  const rawStrikethrough = bundleTier
    ? ingredient.displayPrice * qty
    : ingredient.originalPrice !== null
      ? ingredient.originalPrice * qty
      : null;
  const strikethroughTotal =
    rawStrikethrough !== null && rawStrikethrough > totalPrice ? rawStrikethrough : null;

  const onSale = strikethroughTotal !== null;

  return (
    <div className={`flex items-center gap-3 py-3 ${onSale ? "-mx-4 rounded-lg bg-yellow-50 px-4" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={`shrink-0 h-5 w-5 rounded border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-picnic-red focus:ring-offset-1 flex items-center justify-center ${
          checked ? "border-picnic-red bg-picnic-red" : "border-gray-300 bg-white"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imgSrc}
          alt={ingredient.name}
          fill
          unoptimized
          className={`object-contain p-1 transition-opacity ${checked ? "" : "opacity-40"}`}
          onError={() => {
            if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER);
          }}
        />
      </div>
      <div className={`min-w-0 flex-1 transition-opacity ${checked ? "" : "opacity-40"}`}>
        <p className="text-text-dark truncate text-sm font-medium">{ingredient.name}</p>
        <p className="text-text-muted text-xs">{subtitle}</p>
      </div>
      <div className={`shrink-0 text-right transition-opacity ${checked ? "" : "opacity-40"}`}>
        <p className={`text-sm font-medium ${onSale ? "text-amber-600" : "text-text-dark"}`}>
          {formatEuroPrice(totalPrice)}
        </p>
        {onSale && (
          <p className="text-xs text-gray-400 line-through">{formatEuroPrice(strikethroughTotal)}</p>
        )}
      </div>
    </div>
  );
}
