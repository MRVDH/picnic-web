"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { buildImageUrl } from "@/lib/image-url";
import type { RecipeItem } from "@/lib/types";

const PLACEHOLDER = "/placeholder-product.svg";

type RecipeCardProps = {
  recipe: RecipeItem;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const countryCode = useCountryCode();
  const t = useTranslations();
  const [imageSrc, setImageSrc] = useState(
    recipe.imageId ? buildImageUrl(recipe.imageId, countryCode) : PLACEHOLDER
  );

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="border-card-border bg-card-bg flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-gray-50">
        <Image
          src={imageSrc}
          alt={recipe.name}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => {
            if (imageSrc !== PLACEHOLDER) setImageSrc(PLACEHOLDER);
          }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-text-dark line-clamp-2 text-sm leading-snug font-medium">
          {recipe.name}
        </h3>

        {recipe.cookingTimeMinutes !== null && (
          <p className="text-text-muted text-xs">
            {recipe.cookingTimeMinutes} {t.cookingTimeMinutes}
          </p>
        )}
      </div>
    </Link>
  );
}
