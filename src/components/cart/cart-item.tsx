"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { CartPrice } from "@/components/cart/cart-price";
import { UnavailableOverlay } from "@/components/product/unavailable-product";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useCountryCode } from "@/contexts/country-context";
import { buildImageUrl } from "@/lib/core/image-url";
import type { CartItem } from "@/lib/core/types";

type CartItemCardProps = {
  item: CartItem;
  onIncrement?: () => void;
  onDecrement?: () => void;
};

/**
 * A cart line like the app's basket row: the quantity on the left, then the
 * image, name, unit quantity and badges, with the price at the bottom right.
 * With handlers the quantity is a − / + stepper (quicker than the app's
 * tap-to-edit); without them, as on past orders, it only shows the count.
 * The image and name link to the product page.
 */
export function CartItemCard({ item, onIncrement, onDecrement }: CartItemCardProps) {
  const countryCode = useCountryCode();
  const [imgError, setImgError] = useState(false);
  const imageSrc =
    imgError || !item.imageId
      ? "/placeholder-product.svg"
      : buildImageUrl(item.imageId, countryCode);
  const canEdit = !item.isUnavailable && onIncrement && onDecrement;

  return (
    <div className={`border-card-border border-b py-4 ${item.isUnavailable ? "bg-gray-50" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Quantity */}
        {!item.isUnavailable && (
          <div className="shrink-0">
            {canEdit ? (
              <QuantityStepper
                variant="cart"
                quantity={item.quantity}
                maxCount={item.maxCount}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            ) : (
              <span className="text-foreground flex h-11 min-w-11 items-center justify-center rounded-full bg-[#f5f1ec] px-3 text-lg">
                {item.quantity}
              </span>
            )}
          </div>
        )}

        <Link
          href={`/product/${item.productId}`}
          className={`flex min-w-0 flex-1 gap-3 rounded-lg transition-colors hover:bg-gray-50 ${item.isUnavailable ? "opacity-60" : ""}`}
        >
          {/* Product image */}
          <div className="relative h-16 w-16 shrink-0 md:h-20 md:w-20">
            <Image
              src={imageSrc}
              alt={item.name}
              fill
              unoptimized
              className="object-contain"
              onError={() => setImgError(true)}
            />
          </div>

          {/* Product info */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="text-foreground line-clamp-2 text-base md:text-lg">{item.name}</p>
            <p className="text-text-muted text-sm md:text-base">{item.unitQuantity}</p>
            {item.badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.badges.map((badge, i) => (
                  <Badge key={i} badge={badge} />
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Price (hidden for unavailable items) */}
        {!item.isUnavailable && (
          <div className="flex shrink-0 self-end">
            <CartPrice displayPrice={item.displayPrice} originalPrice={item.originalPrice} />
          </div>
        )}
      </div>

      {/* Unavailability explanation */}
      {item.isUnavailable && <UnavailableOverlay explanation={item.unavailableExplanation} />}
    </div>
  );
}
