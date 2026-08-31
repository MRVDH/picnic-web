"use client";

import { useTranslations } from "@/contexts/country-context";
import type { DeliveryListItem, DeliveryStatus } from "@/lib/core/delivery-types";
import { formatPrice } from "@/lib/core/format-price";

type DeliveryStatusBadgeProps = {
  status: DeliveryStatus;
};

export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  const t = useTranslations();

  const label =
    status === "CURRENT"
      ? t.deliveriesStatusCurrent
      : status === "COMPLETED"
        ? t.deliveriesStatusCompleted
        : status === "CANCELLED"
          ? t.deliveriesStatusCancelled
          : status;

  const colorClass =
    status === "CURRENT"
      ? "bg-picnic-green/15 text-picnic-green"
      : status === "CANCELLED"
        ? "bg-gray-100 text-gray-600"
        : "bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

type DeliveryCardProps = {
  delivery: DeliveryListItem;
  /** True only when Picnic reports scenario_in_progress (van en route). */
  liveTrackingAvailable?: boolean;
};

export function DeliveryCard({ delivery, liveTrackingAvailable = false }: DeliveryCardProps) {
  const t = useTranslations();

  const itemLabel =
    delivery.itemCount === 1
      ? `1 ${t.productSingular}`
      : `${delivery.itemCount} ${t.productPlural}`;

  const showItemCount = delivery.itemCount > 0;

  return (
    <a
      href={`/deliveries/${delivery.id}`}
      className={`border-card-border bg-card-bg block rounded-xl border p-4 transition-colors hover:border-gray-300 ${
        liveTrackingAvailable ? "ring-picnic-green ring-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <DeliveryStatusBadge status={delivery.status} />
            {liveTrackingAvailable && (
              <span className="text-picnic-green text-xs font-semibold">
                {t.deliveriesLiveTrack}
              </span>
            )}
          </div>
          <p className="text-foreground font-semibold">{delivery.deliveryWindowText}</p>
          {showItemCount && (
            <p className="text-text-muted mt-0.5 text-sm">
              {itemLabel}
              {delivery.orderCount > 1
                ? ` · ${delivery.orderCount} ${t.deliveriesOrdersLabel}`
                : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-foreground font-bold">{formatPrice(delivery.totalPrice)}</span>
          <span className="text-text-muted" aria-hidden="true">
            ›
          </span>
        </div>
      </div>
    </a>
  );
}
