"use client";

import type { ReactNode } from "react";

import { useTranslations } from "@/contexts/country-context";
import { formatPrice } from "@/lib/core/format-price";
import type { CartFooterText, DepositEntry, FeeEntry } from "@/lib/core/types";

type OrderSummaryProps = {
  totalPrice: number;
  totalCount: number;
  depositTotal: number;
  depositBreakdown: DepositEntry[];
  membershipSavings: number;
  /** Promotion savings (the app's "Actie" line), without the membership discount. */
  promoSavings: number;
  fees: FeeEntry[];
  minimumOrderValue: number | null;
  /** Picnic's "Spaarpunten" line from the basket footer, shown under the total. */
  loyaltyPoints?: { label: CartFooterText; value: CartFooterText } | null;
  /** Plain rows like the app's basket, instead of a card with a heading. */
  plain?: boolean;
};

/** The app's Family badge color. */
const FAMILY_GREEN = "#295813";
/** The app's promotion yellow. */
const PROMO_YELLOW = "#fbd92b";

/**
 * The order summary, like the app's basket: savings as "Family" and "Actie"
 * pills, deposits, fees, delivery, the minimum order and the total.
 * Hidden when the cart is empty (totalCount === 0).
 */
export function OrderSummary({
  totalPrice,
  totalCount,
  depositBreakdown,
  membershipSavings,
  promoSavings,
  fees,
  minimumOrderValue,
  loyaltyPoints,
  plain = false,
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

  // Picnic lists a delivery fee among the fees when there is one; without it, delivery is free.
  const hasDeliveryFee = fees.some((fee) => fee.type.toUpperCase().includes("DELIVERY"));

  const rows = (
    <div className="text-foreground space-y-3 text-base">
      <Row label={<span className="text-text-muted">{`${t.itemsLabel} (${totalCount})`}</span>} />

      {membershipSavings > 0 && (
        <Row
          label={
            <Pill color={FAMILY_GREEN} textColor="#ffffff">
              {t.accountFamilyBadge}
            </Pill>
          }
          value={`-${formatPrice(membershipSavings)}`}
        />
      )}

      {promoSavings > 0 && (
        <Row
          label={
            <Pill color={PROMO_YELLOW} textColor="#333333">
              {t.cartPromoLabel}
            </Pill>
          }
          value={`-${formatPrice(promoSavings)}`}
        />
      )}

      {depositBreakdown
        .filter((entry) => entry.total > 0)
        .map((entry) => (
          <Row key={entry.type} label={depositLabel(entry.type)} value={formatPrice(entry.total)} />
        ))}

      {fees.map((fee) => (
        <Row
          key={fee.type}
          label={fee.name}
          value={fee.amount < 0 ? `-${formatPrice(Math.abs(fee.amount))}` : formatPrice(fee.amount)}
        />
      ))}

      {!hasDeliveryFee && <Row label={t.cartDeliveryLabel} value={t.cartDeliveryFree} />}

      {minimumOrderValue !== null && minimumOrderValue > 0 && (
        <Row
          label={t.minimumOrderLabel}
          value={
            <span className={totalPrice >= minimumOrderValue ? "text-picnic-green" : ""}>
              {totalPrice >= minimumOrderValue && <span className="mr-1">&#10003;</span>}
              {formatPrice(minimumOrderValue)}
            </span>
          }
        />
      )}

      <div className="border-card-border flex justify-between border-t-2 pt-4 text-2xl font-bold">
        <span>{t.totalLabel}</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>

      {loyaltyPoints && (
        <Row
          label={
            <span style={{ color: loyaltyPoints.label.color ?? undefined }}>
              {loyaltyPoints.label.text}
            </span>
          }
          value={
            <span style={{ color: loyaltyPoints.value.color ?? undefined }}>
              {loyaltyPoints.value.text}
            </span>
          }
        />
      )}
    </div>
  );

  if (plain) return rows;

  return (
    <div className="border-card-border bg-card-bg rounded-xl border p-4">
      <h2 className="text-foreground mb-3 text-base font-semibold">{t.orderSummaryTitle}</h2>
      {rows}
    </div>
  );
}

function Row({ label, value }: { label: ReactNode; value?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      {value !== undefined && <span>{value}</span>}
    </div>
  );
}

function Pill({
  color,
  textColor,
  children,
}: {
  color: string;
  textColor: string;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-base"
      style={{ backgroundColor: color, color: textColor }}
    >
      {children}
    </span>
  );
}
