/**
 * Cart page sub-components.
 *
 * Extracted from page.tsx to respect the 300-line constitution limit.
 * Contains the main cart content layout and the empty-cart placeholder.
 */

"use client";

import Link from "next/link";
import type { CartData } from "@/lib/types";
import { CartItemCard } from "@/components/cart-item";
import { OrderSummary } from "@/components/order-summary";
import { ProductSlider } from "@/components/product-slider";
import { CheckoutCta } from "@/components/checkout-cta";
import { DeliverySlotBanner } from "@/components/delivery-slot-banner";

export function EmptyView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">🛒</div>
      <p className="text-lg font-semibold text-foreground">Je winkelwagen is leeg</p>
      <p className="mt-1 text-sm text-gray-500">
        Voeg producten toe via de Picnic app of zoek iets op.
      </p>
      <Link href="/" className="mt-4 text-sm text-picnic-red hover:underline">
        Naar zoeken
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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Winkelwagen</h1>

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

      <ProductSlider title="Niets vergeten?" products={cart.suggestions} />

      <CheckoutCta />
    </div>
  );
}
