"use client";

import Image from "next/image";

import { useCountryCode, useTranslations } from "@/contexts/country-context";
import type { CategoryItem } from "@/lib/category-types";
import { buildImageUrl } from "@/lib/image-url";

type CategoryGridProps = {
  categories: CategoryItem[];
  onCategoryTap?: (category: CategoryItem) => void;
};

export function CategoryGrid({ categories, onCategoryTap }: CategoryGridProps) {
  const t = useTranslations();
  return (
    <div>
      <h2 className="text-foreground mb-3 text-lg font-semibold">{t.allCategoriesTitle}</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {categories.map((category, index) => (
          <CategoryRow
            key={category.id}
            category={category}
            isLast={index === categories.length - 1}
            onTap={onCategoryTap}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  isLast,
  onTap,
}: {
  category: CategoryItem;
  isLast: boolean;
  onTap?: (category: CategoryItem) => void;
}) {
  const countryCode = useCountryCode();
  return (
    <button
      type="button"
      onClick={() => onTap?.(category)}
      className={`flex w-full items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50 active:bg-gray-100 ${isLast ? "" : "border-b border-gray-100"}`}
    >
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={buildImageUrl(category.imageId, countryCode)}
          alt={category.name}
          fill
          unoptimized
          className="object-contain"
          sizes="56px"
        />
      </div>

      <span className="text-foreground min-w-0 flex-1 text-left text-[15px] leading-tight font-medium">
        {category.name}
      </span>

      <ChevronRightIcon />
    </button>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
