import { CENTS_DIVISOR } from "@/lib/types";
import type { DepositEntry } from "@/lib/types";

type OrderSummaryProps = {
  totalPrice: number;
  totalCount: number;
  totalDiscount: number;
  depositTotal: number;
  depositBreakdown: DepositEntry[];
  membershipSavings: number;
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / CENTS_DIVISOR);
}

function depositLabel(type: string): string {
  switch (type.toUpperCase()) {
    case "BAG":
      return "Statiegeld tasje";
    case "BOTTLE":
      return "Statiegeld fles";
    default:
      return "Statiegeld";
  }
}

/**
 * Displays the financial order summary: item total, discount, deposit
 * breakdown, membership savings, and the overall checkout total.
 * Hidden when the cart is empty (totalCount === 0).
 */
export function OrderSummary({
  totalPrice,
  totalCount,
  totalDiscount,
  depositBreakdown,
  membershipSavings,
}: OrderSummaryProps) {
  if (totalCount === 0) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <h2 className="mb-3 text-base font-semibold text-foreground">
        Besteloverzicht
      </h2>

      <div className="space-y-2 text-sm">
        {/* Item count row */}
        <div className="flex justify-between text-gray-700">
          <span>
            Artikelen ({totalCount})
          </span>
        </div>

        {/* Discount row */}
        {totalDiscount > 0 && (
          <div className="flex justify-between text-picnic-green">
            <span>Korting</span>
            <span>−{formatPrice(totalDiscount)}</span>
          </div>
        )}

        {/* Deposit breakdown rows */}
        {depositBreakdown
          .filter((entry) => entry.total > 0)
          .map((entry) => (
            <div key={entry.type} className="flex justify-between text-gray-700">
              <span>{depositLabel(entry.type)}</span>
              <span>{formatPrice(entry.total)}</span>
            </div>
          ))}

        {/* Membership savings row */}
        {membershipSavings > 0 && (
          <div className="flex justify-between text-picnic-green">
            <span>Picnic-lidmaatschapsbesparing</span>
            <span>−{formatPrice(membershipSavings)}</span>
          </div>
        )}

        {/* Total row */}
        <div className="flex justify-between border-t border-card-border pt-2 font-bold text-foreground">
          <span>Totaal</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
