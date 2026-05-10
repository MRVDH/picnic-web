"use client";

import { useCountryCode, useTranslations } from "@/contexts/country-context";

/**
 * Checkout button linking to the Picnic app deeplink for the cart.
 * Only shown when the cart has items (rendered conditionally by the cart page).
 */
export function CheckoutCta() {
  const countryCode = useCountryCode();
  const t = useTranslations();
  return (
    <a
      href={`https://picnic.app/${countryCode.toLowerCase()}/deeplink/?path=cart`}
      className="bg-picnic-red block w-full rounded-xl py-4 text-center text-base font-semibold text-white transition-colors hover:bg-red-700"
    >
      {t.checkoutLabel}
    </a>
  );
}
