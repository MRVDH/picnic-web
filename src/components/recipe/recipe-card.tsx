"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { FavoriteButton } from "@/components/recipe/favorite-button";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { buildRecipeImageUrl } from "@/lib/core/image-url";
import type { RecipeItem } from "@/lib/core/types";

const PLACEHOLDER = "/placeholder-product.svg";

type RecipeCardProps = {
  recipe: RecipeItem;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const countryCode = useCountryCode();
  const t = useTranslations();
  const [imageSrc, setImageSrc] = useState(
    recipe.imageId ? buildRecipeImageUrl(recipe.imageId, countryCode) : PLACEHOLDER
  );

  return (
    // The favorite button is a sibling of the link, not a child: a <button>
    // inside an <a> is invalid HTML.
    <div className="border-card-border bg-card-bg relative flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md">
      <FavoriteButton recipeId={recipe.id} className="absolute top-2 right-2 z-10" />

      <Link href={`/recipe/${recipe.id}`} className="flex flex-1 flex-col">
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
    </div>
  );
}
