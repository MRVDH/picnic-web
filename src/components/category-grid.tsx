"use client";

import Image from "next/image";
import { buildImageUrl } from "@/lib/image-url";
import type { CategoryItem } from "@/lib/category-types";

type CategoryGridProps = {
  categories: CategoryItem[];
  onCategoryTap?: (category: CategoryItem) => void;
};

export function CategoryGrid({ categories, onCategoryTap }: CategoryGridProps) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">
        Alle categorieën
      </h2>
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
  return (
    <button
      type="button"
      onClick={() => onTap?.(category)}
      className={`flex w-full items-center gap-3 px-3 py-2 transition-colors
                  hover:bg-gray-50 active:bg-gray-100
                  ${isLast ? "" : "border-b border-gray-100"}`}
    >
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={buildImageUrl(category.imageId)}
          alt={category.name}
          fill
          unoptimized
          className="object-contain"
          sizes="56px"
        />
      </div>

      <span className="min-w-0 flex-1 text-left text-[15px] font-medium leading-tight text-foreground">
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
