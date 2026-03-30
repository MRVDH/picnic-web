"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { buildImageUrl } from "@/lib/image-url";
import { PriceDisplay } from "./price-display";
import { Badge } from "./badge";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const FLAG_SIZE = 14;

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const [imageSrc, setImageSrc] = useState(
    product.imageId ? buildImageUrl(product.imageId) : PLACEHOLDER_IMAGE,
  );

  return (
    <div className="relative flex flex-col rounded-lg border border-card-border bg-card-bg p-4 shadow-sm">
      {/* Product image */}
      <div className="relative mb-3 flex h-32 items-center justify-center">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-contain"
          sizes="128px"
          unoptimized
          onError={() => {
            if (imageSrc !== PLACEHOLDER_IMAGE) {
              setImageSrc(PLACEHOLDER_IMAGE);
            }
          }}
        />

        {/* Unavailability overlay on image area */}
        {product.isUnavailable && product.unavailableReason && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgba(231,236,215,0.55)]">
            <span className="text-sm font-medium text-[#5b534e]">
              {product.unavailableReason}
            </span>
          </div>
        )}
      </div>

      {/* Subtitle (e.g. "D.O.P. Sarnese-Nocerino") */}
      {product.subtitle && (
        <p className="mb-0.5 truncate text-xs text-[#5b534e]">
          {product.subtitle}
        </p>
      )}

      {/* Product name */}
      <h3 className="mb-0.5 text-sm font-medium leading-snug text-[#333333] line-clamp-2">
        {product.namePrefix && (
          <span className="font-bold text-[#628003]">
            {product.namePrefix}{" "}
          </span>
        )}
        {product.name}
      </h3>

      {/* Brand / highlight row */}
      {(product.brand || product.highlight || product.flagIconKey) && (
        <div className="mb-0.5 flex items-center gap-1">
          {product.flagIconKey && product.flagFallbackImageId && (
            <span
              className="relative inline-block"
              style={{ width: FLAG_SIZE, height: FLAG_SIZE }}
            >
              <Image
                src={buildImageUrl(product.flagFallbackImageId, "small")}
                alt={product.flagIconKey}
                fill
                sizes={`${FLAG_SIZE}px`}
                unoptimized
              />
            </span>
          )}
          {product.brand && (
            <span className="text-sm text-[#333333]">{product.brand}</span>
          )}
          {product.highlight && (
            <span
              className="text-sm font-medium"
              style={{ color: product.highlight.color }}
            >
              {product.highlight.text}
            </span>
          )}
        </div>
      )}

      {/* Unit quantity */}
      <p className="mb-2 text-xs text-[#5b534e]">{product.unitQuantity}</p>

      {/* Price */}
      <div className="mb-2">
        <PriceDisplay
          displayPrice={product.displayPrice}
          originalPrice={product.originalPrice}
        />
      </div>

      {/* Badges */}
      {product.badges.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1">
          {product.badges.map((badge, index) => (
            <Badge key={`${badge.variant}-${index}`} badge={badge} />
          ))}
        </div>
      )}

      {/* Full-tile dim overlay for unavailable products (text area) */}
      {product.isUnavailable && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/40" />
      )}
    </div>
  );
}
