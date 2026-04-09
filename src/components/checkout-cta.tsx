/**
 * Static banner directing users to complete their order in the Picnic app.
 * Only shown when the cart has items (rendered conditionally by the cart page).
 */
export function CheckoutCta() {
  return (
    <div className="rounded-xl border border-picnic-red/20 bg-picnic-red/5 p-6 text-center">
      <div className="mb-2 text-3xl">&#128722;</div>
      <p className="text-lg font-semibold text-foreground">
        Afrekenen kan via de Picnic app
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Download de app om je bestelling af te ronden.
      </p>
    </div>
  );
}
