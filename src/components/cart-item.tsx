"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CartItem } from "@/lib/types";
import { buildImageUrl } from "@/lib/image-url";
import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/badge";
import { UnavailableOverlay } from "@/components/unavailable-product";
import { QuantityStepper } from "@/components/quantity-stepper";
import { useCountryCode } from "@/contexts/country-context";

type CartItemCardProps = {
  item: CartItem;
  onIncrement?: () => void;
  onDecrement?: () => void;
};

/**
 * Displays a single cart line item: image, name, unit quantity, quantity,
 * price (with optional discount), and decorator badges.
 * The main content links to the product detail page.
 * When unavailable, applies a visual distinction and renders UnavailableOverlay.
 */
export function CartItemCard({ item, onIncrement, onDecrement }: CartItemCardProps) {
  const countryCode = useCountryCode();
  const [imgError, setImgError] = useState(false);
  const imageSrc =
    imgError || !item.imageId
      ? "/placeholder-product.svg"
      : buildImageUrl(item.imageId, countryCode);

  return (
    <div className={`border-card-border border-b py-2${item.isUnavailable ? "bg-gray-50" : ""}`}>
      <div className="flex gap-3">
        <Link
          href={`/product/${item.productId}`}
          className={`flex min-w-0 flex-1 gap-3 transition-colors hover:bg-gray-50${item.isUnavailable ? "opacity-60" : ""}`}
        >
          {/* Product image */}
          <div className="relative h-14 w-14 shrink-0 md:h-16 md:w-16">
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
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div>
              <p className="text-foreground line-clamp-2 text-sm font-semibold">{item.name}</p>
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
        </Link>

        {/* Quantity + price (hidden for unavailable items) */}
        {!item.isUnavailable && onIncrement && onDecrement && (
          <div className="flex shrink-0 flex-col items-end justify-center gap-1">
            <QuantityStepper
              variant="cart"
              quantity={item.quantity}
              maxCount={item.maxCount}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
            <PriceDisplay displayPrice={item.displayPrice} originalPrice={item.originalPrice} />
          </div>
        )}
      </div>

      {/* Unavailability explanation (US4) */}
      {item.isUnavailable && <UnavailableOverlay explanation={item.unavailableExplanation} />}
    </div>
  );
}
