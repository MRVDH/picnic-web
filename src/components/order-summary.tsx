"use client";

import { useTranslations } from "@/contexts/country-context";
import { formatPrice } from "@/lib/format-price";
import type { DepositEntry, FeeEntry } from "@/lib/types";

type OrderSummaryProps = {
  totalPrice: number;
  totalCount: number;
  totalDiscount: number;
  depositTotal: number;
  depositBreakdown: DepositEntry[];
  membershipSavings: number;
  fees: FeeEntry[];
  minimumOrderValue: number | null;
};

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
  fees,
  minimumOrderValue,
}: OrderSummaryProps) {
  const t = useTranslations();

  if (totalCount === 0) return null;

  function depositLabel(type: string): string {
    switch (type.toUpperCase()) {
      case "BAG":
        return t.depositBag;
      case "BOTTLE":
        return t.depositBottle;
      default:
        return t.depositGeneric;
    }
  }

  return (
    <div className="border-card-border bg-card-bg rounded-xl border p-4">
      <h2 className="text-foreground mb-3 text-base font-semibold">{t.orderSummaryTitle}</h2>

      <div className="space-y-2 text-sm">
        {/* Item count row */}
        <div className="flex justify-between text-gray-700">
          <span>
            {t.itemsLabel} ({totalCount})
          </span>
        </div>

        {/* Discount row */}
        {totalDiscount > 0 && (
          <div className="text-picnic-green flex justify-between">
            <span>{t.discountLabel}</span>
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
          <div className="text-picnic-green flex justify-between">
            <span>{t.membershipSavingsLabel}</span>
            <span>−{formatPrice(membershipSavings)}</span>
          </div>
        )}

        {/* Fee rows (e.g. Picnic credit settlement) */}
        {fees.map((fee) => (
          <div
            key={fee.type}
            className={`flex justify-between ${fee.amount < 0 ? "text-picnic-green" : "text-gray-700"}`}
          >
            <span>{fee.name}</span>
            <span>
              {fee.amount < 0 ? `−${formatPrice(Math.abs(fee.amount))}` : formatPrice(fee.amount)}
            </span>
          </div>
        ))}

        {/* Minimum order value row */}
        {minimumOrderValue !== null && minimumOrderValue > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>{t.minimumOrderLabel}</span>
            <span className={totalPrice >= minimumOrderValue ? "text-picnic-green" : ""}>
              {totalPrice >= minimumOrderValue && <span className="mr-1">&#10003;</span>}
              {formatPrice(minimumOrderValue)}
            </span>
          </div>
        )}

        {/* Total row */}
        <div className="border-card-border text-foreground flex justify-between border-t pt-2 font-bold">
          <span>{t.totalLabel}</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
