import type { DeliveryListItem, DeliveryStatus } from "@/lib/core/delivery-types";
import { asArray, asNumber, asString, isObject } from "@/lib/core/type-guards";
import type { CountryCode } from "@/lib/core/types";
import { formatDeliveryWindowText } from "@/lib/delivery/format-delivery-window";

function parseDeliveryWindow(raw: Record<string, unknown>): {
  windowStart: string | null;
  windowEnd: string | null;
} {
  const slot = isObject(raw["slot"]) ? raw["slot"] : null;
  const deliveryTime = isObject(raw["delivery_time"]) ? raw["delivery_time"] : null;
  const eta2 = isObject(raw["eta2"]) ? raw["eta2"] : null;

  const windowStart =
    asString(slot?.["window_start"]) ||
    asString(deliveryTime?.["start"]) ||
    asString(eta2?.["start"]) ||
    null;
  const windowEnd =
    asString(slot?.["window_end"]) ||
    asString(deliveryTime?.["end"]) ||
    asString(eta2?.["end"]) ||
    null;

  return { windowStart, windowEnd };
}

function mapDeliverySummary(raw: unknown, countryCode: CountryCode): DeliveryListItem | null {
  if (!isObject(raw)) return null;

  const id = asString(raw["delivery_id"]) || asString(raw["id"]);
  if (!id) return null;

  const status = (asString(raw["status"]) || "COMPLETED") as DeliveryStatus;
  const { windowStart, windowEnd } = parseDeliveryWindow(raw);
  const orders = asArray(raw["orders"]).filter(isObject);

  let totalPrice = 0;
  let itemCount = asNumber(raw["total_count"]) || asNumber(raw["sellable_item_count"]);
  for (const order of orders) {
    totalPrice += asNumber(order["total_price"]) || asNumber(order["checkout_total_price"]);
    // Summary orders are slim — total_count only exists on full order objects.
    itemCount += asNumber(order["total_count"]) || asNumber(order["sellable_item_count"]);
  }

  return {
    id,
    status,
    creationTime: asString(raw["creation_time"]),
    windowStart,
    windowEnd,
    deliveryWindowText: formatDeliveryWindowText(windowStart, windowEnd, countryCode),
    orderCount: orders.length,
    totalPrice,
    itemCount,
  };
}

export function parseDeliveriesSummary(
  rawData: unknown,
  countryCode: CountryCode
): DeliveryListItem[] {
  const rawList = Array.isArray(rawData) ? rawData : asArray(rawData);

  const deliveries = rawList
    .map((entry) => mapDeliverySummary(entry, countryCode))
    .filter((item): item is DeliveryListItem => item !== null);

  // Newest delivery first, like the app. Upcoming (CURRENT) deliveries have a
  // future window, so they land on top without a separate status sort.
  const sortKey = (d: DeliveryListItem) => d.windowStart ?? d.creationTime;
  deliveries.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  return deliveries;
}
