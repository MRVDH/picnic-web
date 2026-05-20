"use client";

import { useState } from "react";

import Image from "next/image";

import { buildRecipeImageUrl } from "@/lib/image-url";
import type { CountryCode } from "@/lib/types";

type RecipeHeroImageProps = {
  imageId: string;
  countryCode: CountryCode;
  alt: string;
};

export function RecipeHeroImage({ imageId, countryCode, alt }: RecipeHeroImageProps) {
  const [show, setShow] = useState(true);
  if (!show) return <div className="aspect-video w-full bg-gray-100" />;
  return (
    <div className="relative aspect-video w-full">
      <Image
        src={buildRecipeImageUrl(imageId, countryCode)}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        priority
        onError={() => setShow(false)}
      />
    </div>
  );
}
