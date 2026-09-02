/** True when the cart total meets the slot minimum order value (or no minimum applies). */
export function isMinimumOrderMet(
  totalPrice: number,
  minimumOrderValue: number | null
): boolean {
  if (minimumOrderValue === null || minimumOrderValue <= 0) return true;
  return totalPrice >= minimumOrderValue;
}
