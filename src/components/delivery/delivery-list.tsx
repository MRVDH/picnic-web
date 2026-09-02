"use client";

import { useCountryCode, useTranslations } from "@/contexts/country-context";
import type { DeliveryListItem } from "@/lib/core/delivery-types";
import { formatPrice } from "@/lib/core/format-price";
import { formatDeliveryDayText, formatTime } from "@/lib/delivery/format-delivery-window";

type DeliveryRowProps = {
  delivery: DeliveryListItem;
  /** True only when Picnic reports scenario_in_progress (van en route). */
  liveTrackingAvailable: boolean;
};

function DeliveryRow({ delivery, liveTrackingAvailable }: DeliveryRowProps) {
  const t = useTranslations();
  const countryCode = useCountryCode();

  const dayText = formatDeliveryDayText(delivery.windowStart, countryCode);
  const isCurrent = delivery.status === "CURRENT";
  const isCancelled = delivery.status === "CANCELLED";
  const timeWindow =
    isCurrent && delivery.windowStart && delivery.windowEnd
      ? `${formatTime(new Date(delivery.windowStart))} - ${formatTime(new Date(delivery.windowEnd))}`
      : null;

  return (
    <li>
      <a
        href={`/deliveries/${delivery.id}`}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1">
          <p className="text-foreground flex flex-wrap items-center gap-x-2 font-medium">
            <span>{dayText}</span>
            {timeWindow && <span className="text-text-muted font-normal">{timeWindow}</span>}
            {isCurrent && (
              <span className="bg-picnic-green/15 text-picnic-green rounded-full px-2 py-0.5 text-xs font-semibold">
                {liveTrackingAvailable ? t.deliveriesLiveTrack : t.deliveriesStatusCurrent}
              </span>
            )}
            {isCancelled && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                {t.deliveriesStatusCancelled}
              </span>
            )}
          </p>
          <p
            className={`mt-0.5 text-sm ${isCancelled ? "text-text-muted line-through" : "text-text-muted"}`}
          >
            € {formatPrice(delivery.totalPrice)}
          </p>
        </div>
        <span className="text-xl leading-none text-gray-400" aria-hidden="true">
          ›
        </span>
      </a>
    </li>
  );
}

type DeliveryListProps = {
  deliveries: DeliveryListItem[];
  liveTrackingIds: ReadonlySet<string>;
};

/** Year of the delivery window, falling back to the creation time. */
function deliveryYear(delivery: DeliveryListItem): number {
  return new Date(delivery.windowStart ?? delivery.creationTime).getFullYear();
}

/**
 * Deliveries as the app shows them: one divided list, newest first, with a
 * year header before the first delivery of every year other than the current one.
 */
export function DeliveryList({ deliveries, liveTrackingIds }: DeliveryListProps) {
  const currentYear = new Date().getFullYear();

  const groups: { year: number; deliveries: DeliveryListItem[] }[] = [];
  for (const delivery of deliveries) {
    const year = deliveryYear(delivery);
    const last = groups[groups.length - 1];
    if (last && last.year === year) {
      last.deliveries.push(delivery);
    } else {
      groups.push({ year, deliveries: [delivery] });
    }
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.year}>
          {group.year !== currentYear && (
            <h2 className="text-picnic-red mb-2 text-lg font-semibold">{group.year}</h2>
          )}
          <ul className="border-card-border bg-card-bg divide-card-border divide-y overflow-hidden rounded-xl border">
            {group.deliveries.map((delivery) => (
              <DeliveryRow
                key={delivery.id}
                delivery={delivery}
                liveTrackingAvailable={liveTrackingIds.has(delivery.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
