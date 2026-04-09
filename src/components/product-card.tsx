"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, BundleProgress } from "@/lib/types";
import { buildImageUrl } from "@/lib/image-url";
import { PriceDisplay } from "./price-display";
import { Badge } from "./badge";
import { QuantityStepper } from "./quantity-stepper";
import { useCart } from "@/contexts/cart-context";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const FLAG_SIZE = 14;

type ProductCardProps = {
  product: Product;
  /** When provided, wraps the card in a Link for client-side navigation. */
  href?: string;
};

export function ProductCard({ product, href }: ProductCardProps) {
  const [imageSrc, setImageSrc] = useState(
    product.imageId ? buildImageUrl(product.imageId) : PLACEHOLDER_IMAGE,
  );
  const { getQuantity, addProduct, removeProduct, getBundleProgress, registerBundleData } = useCart();
  const quantity = getQuantity(product.id);
  const bundleProgress = getBundleProgress(product.id);
  const showCartActions = !product.isUnavailable;

  // Register bundle thresholds from search results when available.
  useEffect(() => {
    if (product.priceRanges) {
      registerBundleData(product.id, product.priceRanges);
    }
  }, [product.id, product.priceRanges, registerBundleData]);

  // When a bundle threshold is active, compute the discounted unit price.
  const bundleUnitPrice = getActiveBundlePrice(bundleProgress, quantity);
  const effectiveDisplayPrice = bundleUnitPrice ?? product.displayPrice;
  const bundleOriginalPrice = bundleUnitPrice ? product.displayPrice : null;

  const cardContent = (
    <div
      className={`relative flex h-full flex-col rounded-lg border border-card-border bg-card-bg p-4 shadow-sm${
        href ? " transition-shadow hover:shadow-md" : ""
      }`}
    >
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

        {/* Cart action overlay — positioned at bottom-right of image */}
        {showCartActions && (
          <CartActionOverlay
            productId={product.id}
            quantity={quantity}
            maxCount={product.maxCount}
            onAdd={() => addProduct(product.id, product.maxCount)}
            onIncrement={() => addProduct(product.id, product.maxCount)}
            onDecrement={() => removeProduct(product.id)}
            bundleProgress={bundleProgress}
            regularPrice={product.displayPrice}
          />
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

      {/* Price — show bundle-discounted price when applicable */}
      <div className="mb-2">
        <PriceDisplay
          displayPrice={effectiveDisplayPrice}
          originalPrice={
            bundleOriginalPrice ?? product.originalPrice
          }
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

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// ─── Bundle price helper ──────────────────────────────────────────────────────

/** Returns the per-unit price in cents if a bundle threshold is active, or null. */
function getActiveBundlePrice(
  bp: BundleProgress | null,
  quantity: number,
): number | null {
  if (!bp || bp.thresholds.length === 0 || quantity === 0) return null;

  const active = bp.thresholds
    .filter((t) => t.quantity <= quantity)
    .at(-1) ?? null;

  return active ? active.pricePerUnit : null;
}

// ─── Cart action overlay ──────────────────────────────────────────────────────

type CartActionOverlayProps = {
  productId: string;
  quantity: number;
  maxCount: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  bundleProgress: BundleProgress | null;
  regularPrice: number;
};

function CartActionOverlay({
  quantity,
  maxCount,
  onAdd,
  onIncrement,
  onDecrement,
  bundleProgress,
  regularPrice,
}: CartActionOverlayProps) {
  // Prevent click from propagating to the Link wrapper
  const stopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (quantity === 0) {
    return (
      <div className="absolute bottom-1 right-1 z-10" onClick={stopPropagation}>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-[#333333] shadow-md transition-colors hover:bg-gray-100 active:bg-gray-200"
          aria-label="Toevoegen aan winkelwagen"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-1 right-1 z-10" onClick={stopPropagation}>
      <QuantityStepper
        quantity={quantity}
        maxCount={maxCount}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        bundleProgress={bundleProgress}
        regularPrice={regularPrice}
      />
    </div>
  );
}
