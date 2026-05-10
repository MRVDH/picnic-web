/**
 * Cart page sub-components.
 *
 * Extracted from page.tsx to respect the 300-line constitution limit.
 * Contains the main cart content layout and the empty-cart placeholder.
 */

"use client";

import Link from "next/link";

import { CartItemCard } from "@/components/cart-item";
import { CheckoutCta } from "@/components/checkout-cta";
import { DeliverySlotBanner } from "@/components/delivery-slot-banner";
import { OrderSummary } from "@/components/order-summary";
import { ProductSlider } from "@/components/product-slider";
import { useTranslations } from "@/contexts/country-context";
import type { CartData } from "@/lib/types";

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
  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-bold">{t.cartTitle}</h1>

      <DeliverySlotBanner
        bannerText={cart.deliveryBannerText}
        isExplicit={cart.selectedSlot?.isExplicitSelection ?? false}
        onTap={onOpenPicker}
      />

      <div>
        {cart.items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onIncrement={item.isUnavailable ? undefined : () => onIncrement(item.productId)}
            onDecrement={item.isUnavailable ? undefined : () => onDecrement(item.productId)}
          />
        ))}
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
