"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CartItem } from "@/lib/types";
import { buildImageUrl } from "@/lib/image-url";
import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/badge";
import { UnavailableOverlay } from "@/components/unavailable-product";

type CartItemCardProps = {
  item: CartItem;
};

/**
 * Displays a single cart line item: image, name, unit quantity, quantity,
 * price (with optional discount), and decorator badges.
 * The main content links to the product detail page.
 * When unavailable, applies a visual distinction and renders UnavailableOverlay.
 */
export function CartItemCard({ item }: CartItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageSrc =
    imgError || !item.imageId
      ? "/placeholder-product.svg"
      : buildImageUrl(item.imageId);

  return (
    <div className={`border-b border-card-border py-4${item.isUnavailable ? " bg-gray-50" : ""}`}>
      <Link
        href={`/product/${item.productId}`}
        className={`flex gap-4 transition-colors hover:bg-gray-50${item.isUnavailable ? " opacity-60" : ""}`}
      >
        {/* Product image */}
        <div className="relative h-20 w-20 shrink-0 md:h-24 md:w-24">
          <Image
            src={imageSrc}
            alt={item.name}
            fill
            unoptimized
            className="rounded-md object-contain"
            onError={() => setImgError(true)}
          />
        </div>

        {/* Product info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
          <div>
            <p className="line-clamp-2 text-sm font-semibold text-foreground">
              {item.name}
            </p>
            <p className="text-xs text-gray-500">{item.unitQuantity}</p>
          </div>

          {/* Badges */}
          {item.badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.badges.map((badge, i) => (
                <Badge key={i} badge={badge} />
              ))}
            </div>
          )}
        </div>

        {/* Quantity + price (hidden for unavailable items) */}
        {!item.isUnavailable && (
          <div className="flex shrink-0 flex-col items-end justify-between">
            <span className="text-sm text-gray-500">{item.quantity}&times;</span>
            <PriceDisplay
              displayPrice={item.displayPrice}
              originalPrice={item.originalPrice}
            />
          </div>
        )}
      </Link>

      {/* Unavailability explanation (US4) */}
      {item.isUnavailable && (
        <UnavailableOverlay
          explanation={item.unavailableExplanation}
        />
      )}
    </div>
  );
}
