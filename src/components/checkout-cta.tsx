/**
 * Checkout button linking to the Picnic app deeplink for the cart.
 * Only shown when the cart has items (rendered conditionally by the cart page).
 */
export function CheckoutCta() {
  return (
    <a
      href="https://picnic.app/nl/deeplink/?path=cart"
      className="block w-full rounded-xl bg-picnic-red py-4 text-center text-base font-semibold text-white transition-colors hover:bg-red-700"
    >
      Naar de kassa
    </a>
  );
}
