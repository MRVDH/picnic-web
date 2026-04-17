"use client";

import Image from "next/image";
import { buildImageUrl } from "@/lib/image-url";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorView } from "@/components/error-view";
import { BackArrowIcon } from "@/components/back-arrow-icon";
import type { CategoryItem } from "@/lib/category-types";

export type SubcategoriesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; title: string; subcategories: CategoryItem[] }
  | { status: "error"; message: string };

type SubcategoryViewProps = {
  categoryName: string;
  state: SubcategoriesState;
  onBack: () => void;
  onRetry: () => void;
  onSubcategoryTap?: (category: CategoryItem) => void;
};

export function SubcategoryView({
  categoryName,
  state,
  onBack,
  onRetry,
  onSubcategoryTap,
}: SubcategoryViewProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
      >
        <BackArrowIcon />
        Terug
      </button>

      <h2 className="mb-3 text-lg font-semibold text-foreground">
        {categoryName}
      </h2>

      {state.status === "loading" && <LoadingSpinner />}
      {state.status === "idle" && <LoadingSpinner />}
      {state.status === "error" && (
        <div>
          <ErrorView message={state.message} />
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
          >
            Opnieuw proberen
          </button>
        </div>
      )}
      {state.status === "success" && state.subcategories.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          Geen subcategorieën gevonden.
        </p>
      )}
      {state.status === "success" && state.subcategories.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {state.subcategories.map((sub, index) => (
            <SubcategoryRow
              key={sub.id}
              category={sub}
              isLast={index === state.subcategories.length - 1}
              onTap={onSubcategoryTap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A sub-category row — tappable when onTap is provided, otherwise static. */
function SubcategoryRow({
  category,
  isLast,
  onTap,
}: {
  category: CategoryItem;
  isLast: boolean;
  onTap?: (category: CategoryItem) => void;
}) {
  const content = (
    <>
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
    </>
  );

  const sharedClassName = `flex w-full items-center gap-3 px-3 py-2 ${isLast ? "" : "border-b border-gray-100"}`;

  if (onTap) {
    return (
      <button
        type="button"
        onClick={() => onTap(category)}
        className={`${sharedClassName} hover:bg-gray-50`}
      >
        {content}
      </button>
    );
  }

  return <div className={sharedClassName}>{content}</div>;
}
