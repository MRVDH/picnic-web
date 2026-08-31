import { mapOrderLineToCartItem, applyDecoratorOverrides } from "@/lib/cart/parse-cart";
import type { CountryCode } from "@/lib/core/types";
import type {
  DeliveryDetailData,
  DeliveryOrderSummary,
  DeliveryPaymentInfo,
  ReturnedContainerItem,
} from "@/lib/core/delivery-types";
import { asArray, asNumber, asString, isObject } from "@/lib/core/type-guards";

import { formatDeliveryWindowText } from "@/lib/delivery/format-delivery-window";

function mapDepositBreakdown(raw: unknown) {
  return asArray(raw)
    .filter(isObject)
    .map((entry) => {
      const value = asNumber(entry["value"]);
      const count = asNumber(entry["count"]);
      return {
        type: asString(entry["type"]),
        value,
        count,
        total: value * count,
      };
    });
}

function mapFees(raw: unknown) {
  return asArray(raw)
    .filter(isObject)
    .map((f) => ({
      type: asString(f["type"]),
      name: asString(f["name"]),
      amount: asNumber(f["amount"]),
    }))
    .filter((f) => f.amount !== 0);
}

function mapPayment(raw: unknown): DeliveryPaymentInfo | null {
  if (!isObject(raw)) return null;
  const paymentType = asString(raw["payment_type"]);
  const redactedIban = asString(raw["redacted_iban"]);
  if (!paymentType && !redactedIban) return null;
  return {
    paymentType,
    redactedIban,
    bankId: asString(raw["bank_id"]),
  };
}

function mapOrder(raw: unknown): DeliveryOrderSummary | null {
  if (!isObject(raw)) return null;
  const id = asString(raw["id"]);
  if (!id) return null;

  const overridesMap: Record<string, unknown> = isObject(raw["decorator_overrides"])
    ? (raw["decorator_overrides"] as Record<string, unknown>)
    : {};

  const rawItems = applyDecoratorOverrides(asArray(raw["items"]), overridesMap);
  const items = rawItems
    .map(mapOrderLineToCartItem)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const depositBreakdown = mapDepositBreakdown(raw["deposit_breakdown"]);
  const depositTotal = depositBreakdown.reduce((sum, entry) => sum + entry.total, 0);

  return {
    id,
    items,
    totalPrice: asNumber(raw["total_price"]),
    checkoutTotalPrice: asNumber(raw["checkout_total_price"]),
    totalSavings: asNumber(raw["total_savings"]),
    totalDeposit: asNumber(raw["total_deposit"]) || depositTotal,
    membershipSavings: asNumber(raw["membership_savings"]),
    cancellable: raw["cancellable"] === true,
    status: asString(raw["status"]),
    creationTime: asString(raw["creation_time"]),
    fees: mapFees(raw["fees"]),
    depositBreakdown,
    payment: mapPayment(raw["transaction_info"]),
  };
}

function mapReturnedContainers(raw: unknown): ReturnedContainerItem[] {
  return asArray(raw)
    .filter(isObject)
    .map((entry) => ({
      type: asString(entry["type"]),
      name: asString(entry["localized_name"]) || asString(entry["type"]),
      quantity: asNumber(entry["quantity"]),
      price: asNumber(entry["price"]),
    }));
}

export function parseDeliveryDetail(rawData: unknown, countryCode: CountryCode): DeliveryDetailData {
  if (!isObject(rawData)) {
    return emptyDeliveryDetail(countryCode);
  }

  const id = asString(rawData["delivery_id"]) || asString(rawData["id"]);
  const slot = isObject(rawData["slot"]) ? rawData["slot"] : null;
  const deliveryTime = isObject(rawData["delivery_time"]) ? rawData["delivery_time"] : null;
  const windowStart =
    asString(slot?.["window_start"]) || asString(deliveryTime?.["start"]) || null;
  const windowEnd = asString(slot?.["window_end"]) || asString(deliveryTime?.["end"]) || null;

  const orders = asArray(rawData["orders"])
    .map(mapOrder)
    .filter((order): order is DeliveryOrderSummary => order !== null);

  const allItems = orders.flatMap((order) => order.items);
  const totalPrice = orders.reduce((sum, order) => sum + order.checkoutTotalPrice, 0);
  const totalCount = allItems.reduce((sum, item) => sum + item.quantity, 0);
  let totalDiscount = 0;
  for (const item of allItems) {
    if (item.originalPrice !== null && item.originalPrice > item.displayPrice) {
      totalDiscount += (item.originalPrice - item.displayPrice) * item.quantity;
    }
  }
  const depositBreakdown = orders.flatMap((order) => order.depositBreakdown);
  const depositTotal = depositBreakdown.reduce((sum, entry) => sum + entry.total, 0);
  const membershipSavings = orders.reduce((sum, order) => sum + order.membershipSavings, 0);
  const fees = orders.flatMap((order) => order.fees);
  const cancellable = orders.some((order) => order.cancellable);

  return {
    id,
    status: asString(rawData["status"]),
    creationTime: asString(rawData["creation_time"]),
    windowStart,
    windowEnd,
    deliveryWindowText: formatDeliveryWindowText(windowStart, windowEnd, countryCode),
    orders,
    returnedContainers: mapReturnedContainers(rawData["returned_containers"]),
    totalPrice,
    totalCount,
    totalDiscount,
    depositTotal,
    depositBreakdown,
    membershipSavings,
    fees,
    cancellable,
  };
}

function emptyDeliveryDetail(countryCode: CountryCode): DeliveryDetailData {
  return {
    id: "",
    status: "COMPLETED",
    creationTime: "",
    windowStart: null,
    windowEnd: null,
    deliveryWindowText: formatDeliveryWindowText(null, null, countryCode),
    orders: [],
    returnedContainers: [],
    totalPrice: 0,
    totalCount: 0,
    totalDiscount: 0,
    depositTotal: 0,
    depositBreakdown: [],
    membershipSavings: 0,
    fees: [],
    cancellable: false,
  };
}
