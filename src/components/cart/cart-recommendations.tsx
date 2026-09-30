"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { ChevronRightIcon } from "@/components/layout/nav-icons";
import { useCountryCode } from "@/contexts/country-context";
import { buildImageUrl } from "@/lib/core/image-url";
import type { CartFooterData, CartRecommendationTile } from "@/lib/core/types";

type CartRecommendationsProps = {
  recommendations: NonNullable<CartFooterData["recommendations"]>;
};

/**
 * The app's "Niets vergeten?" row: product tiles on their pastel background,
 * with a yellow marker on promotions. The title opens the full list, like the
 * app; a tile opens its product page directly.
 */
export function CartRecommendations({ recommendations }: CartRecommendationsProps) {
  const listHref = `/pages?${new URLSearchParams({
    pageId: recommendations.pageId,
    title: recommendations.title,
  }).toString()}`;

  return (
    <section>
      <Link
        href={listHref}
        className="text-foreground mb-3 inline-flex items-center gap-1 text-2xl font-semibold hover:underline"
      >
        {recommendations.title}
        <ChevronRightIcon className="h-5 w-5" />
      </Link>
      <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none]">
        {recommendations.tiles.map((tile) => (
          <li key={tile.productId} className="shrink-0">
            <Tile tile={tile} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tile({ tile }: { tile: CartRecommendationTile }) {
  const countryCode = useCountryCode();
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/product/${tile.productId}`}
      className="relative block h-20 w-20 overflow-hidden rounded-lg transition-opacity hover:opacity-80"
      style={{ backgroundColor: tile.backgroundColor ?? "#f5f1ec" }}
    >
      {!imgError && (
        <Image
          src={buildImageUrl(tile.imageId, countryCode)}
          alt=""
          fill
          unoptimized
          className="object-contain p-1"
          onError={() => setImgError(true)}
        />
      )}
      {tile.hasPromo && (
        <span className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#fbd92b] text-[11px] font-bold text-[#333333]">
          %
        </span>
      )}
    </Link>
  );
}
