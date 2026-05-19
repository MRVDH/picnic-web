"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { CartItemCard } from "@/components/cart/cart-item";
import { CheckoutCta } from "@/components/cart/checkout-cta";
import { OrderSummary } from "@/components/cart/order-summary";
import { DeliverySlotBanner } from "@/components/delivery/delivery-slot-banner";
import { ProductSlider } from "@/components/product/product-slider";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { buildRecipeImageUrl } from "@/lib/core/image-url";
import type { CartData, CartItem, CartRecipeGroup } from "@/lib/core/types";

export function EmptyView() {
  const t = useTranslations();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">🛒</div>
      <p className="text-foreground text-lg font-semibold">{t.emptyCartTitle}</p>
      <p className="mt-1 text-sm text-gray-500">{t.emptyCartText}</p>
      <Link href="/" className="text-picnic-red mt-4 text-sm hover:underline">
        {t.goToSearch}
      </Link>
    </div>
  );
}

function RecipeGroupSection({
  group,
  items,
  onIncrement,
  onDecrement,
}: {
  group: CartRecipeGroup;
  items: CartItem[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}) {
  const countryCode = useCountryCode();
  const [imgError, setImgError] = useState(false);
  const imageSrc =
    group.imageId && !imgError ? buildRecipeImageUrl(group.imageId, countryCode) : null;

  return (
    <div>
      <Link
        href={`/recipe/${group.id}`}
        className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-1 py-2 transition-colors hover:bg-gray-100"
      >
        {imageSrc && (
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
            <Image
              src={imageSrc}
              alt=""
              fill
              unoptimized
              className="object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        )}
        <span className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
          {group.title}
        </span>
        <span className="text-xs text-gray-400">›</span>
      </Link>
      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          onIncrement={item.isUnavailable ? undefined : () => onIncrement(item.productId)}
          onDecrement={item.isUnavailable ? undefined : () => onDecrement(item.productId)}
        />
      ))}
    </div>
  );
}

export function CartPageContent({
  cart,
  onIncrement,
  onDecrement,
  onOpenPicker,
}: {
  cart: CartData;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onOpenPicker: () => void;
}) {
  const t = useTranslations();

  // Group items by their recipe (basketGroupId), keeping API order within each group.
  const itemsByGroupId = new Map<string, CartItem[]>();
  const otherItems: CartItem[] = [];
  for (const item of cart.items) {
    if (item.basketGroupId) {
      const list = itemsByGroupId.get(item.basketGroupId) ?? [];
      list.push(item);
      itemsByGroupId.set(item.basketGroupId, list);
    } else {
      otherItems.push(item);
    }
  }

  // Only show recipe groups that have at least one item still in the cart
  // (handles optimistic removals before the server confirms).
  const activeGroups = cart.recipeGroups.filter((g) => (itemsByGroupId.get(g.id)?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-bold">{t.cartTitle}</h1>

      <DeliverySlotBanner
        bannerText={cart.deliveryBannerText}
        isExplicit={cart.selectedSlot?.isExplicitSelection ?? false}
        onTap={onOpenPicker}
      />

      <div className={activeGroups.length > 0 ? "space-y-4" : ""}>
        {activeGroups.map((group) => (
          <RecipeGroupSection
            key={group.id}
            group={group}
            items={itemsByGroupId.get(group.id) ?? []}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        ))}

        {otherItems.length > 0 && (
          <div>
            {activeGroups.length > 0 && (
              <p className="mb-1 px-1 text-xs font-medium text-gray-500">{t.cartOtherItems}</p>
            )}
            {otherItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onIncrement={item.isUnavailable ? undefined : () => onIncrement(item.productId)}
                onDecrement={item.isUnavailable ? undefined : () => onDecrement(item.productId)}
              />
            ))}
          </div>
        )}
      </div>

      <OrderSummary
        totalPrice={cart.totalPrice}
        totalCount={cart.totalCount}
        totalDiscount={cart.totalDiscount}
        depositTotal={cart.depositTotal}
        depositBreakdown={cart.depositBreakdown}
        membershipSavings={cart.membershipSavings}
        fees={cart.fees}
        minimumOrderValue={cart.minimumOrderValue}
      />

      <ProductSlider title={t.nothingForgotten} products={cart.suggestions} />

      <CheckoutCta />
    </div>
  );
}
