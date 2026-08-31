"use client";

import Link from "next/link";

import { useTranslations } from "@/contexts/country-context";
import { isMinimumOrderMet } from "@/lib/cart/minimum-order";

type CheckoutCtaProps = {
  totalPrice: number;
  minimumOrderValue: number | null;
};

/**
 * Checkout button linking to the in-app checkout flow.
 * Disabled while the cart total is below the selected slot's minimum order value.
 */
export function CheckoutCta({ totalPrice, minimumOrderValue }: CheckoutCtaProps) {
  const t = useTranslations();
  const canCheckout = isMinimumOrderMet(totalPrice, minimumOrderValue);

  if (!canCheckout) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="bg-picnic-red block w-full cursor-not-allowed rounded-xl py-4 text-center text-base font-semibold text-white opacity-50"
        >
          {t.checkoutLabel}
        </button>
        <p className="text-center text-sm text-gray-500">{t.checkoutMinimumNotMet}</p>
      </div>
    );
  }

  return (
    <Link
      href="/checkout"
      className="bg-picnic-red block w-full rounded-xl py-4 text-center text-base font-semibold text-white transition-colors hover:bg-red-700"
    >
      {t.checkoutLabel}
    </Link>
  );
}
