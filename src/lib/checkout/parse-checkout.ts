import type { CheckoutStartData, PaymentProfileData } from "@/lib/core/checkout-types";
import { asArray, asNumber, asString, isObject } from "@/lib/core/type-guards";

export function parseCheckoutStart(raw: unknown): CheckoutStartData {
  if (!isObject(raw)) {
    return emptyCheckoutStart();
  }

  return {
    orderId: asString(raw["order_id"]),
    totalPrice: asNumber(raw["total_price"]),
    totalCount: asNumber(raw["total_count"]),
    totalDeposit: asNumber(raw["total_deposit"]),
    totalSavings: asNumber(raw["total_savings"]),
    transactionExpiry: asString(raw["transaction_expiry"]),
  };
}

function emptyCheckoutStart(): CheckoutStartData {
  return {
    orderId: "",
    totalPrice: 0,
    totalCount: 0,
    totalDeposit: 0,
    totalSavings: 0,
    transactionExpiry: "",
  };
}

export function parsePaymentProfile(raw: unknown): PaymentProfileData {
  if (!isObject(raw)) {
    return { preferredPaymentOptionId: "", storedOptions: [] };
  }

  const stored = asArray(raw["stored_payment_options"])
    .filter(isObject)
    .map((option) => ({
      id: asString(option["id"]),
      displayName: asString(option["display_name"]),
      account: asString(option["account"]) || null,
      paymentMethod: asString(option["payment_method"]),
      iconUrl: asString(option["icon_url"]),
    }));

  return {
    preferredPaymentOptionId: asString(raw["preferred_payment_option_id"]),
    storedOptions: stored,
  };
}
