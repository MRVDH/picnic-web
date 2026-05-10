"use client";

import { useCountryCode } from "@/contexts/country-context";

const CHECKOUT_LABELS: Record<string, string> = {
  NL: "Naar de kassa",
  DE: "Zur Kasse",
};

/**
 * Checkout button linking to the Picnic app deeplink for the cart.
 * Only shown when the cart has items (rendered conditionally by the cart page).
 */
export function CheckoutCta() {
  const countryCode = useCountryCode();
  const label = CHECKOUT_LABELS[countryCode] ?? CHECKOUT_LABELS["NL"];
  return (
    <a
      href={`https://picnic.app/${countryCode.toLowerCase()}/deeplink/?path=cart`}
      className="bg-picnic-red block w-full rounded-xl py-4 text-center text-base font-semibold text-white transition-colors hover:bg-red-700"
    >
      {label}
    </a>
  );
}
