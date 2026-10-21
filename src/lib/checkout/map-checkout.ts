// Maps picnic-api's checkout responses to the web's checkout types.
import type PicnicClient from "picnic-api";

import type { CheckoutStartData, PaymentProfileData } from "@/lib/core/checkout-types";

type CheckoutStartResult = PicnicClient.Types.checkout.RawCheckoutStartResult;
type PaymentProfile = PicnicClient.Types.payment.RawPaymentProfile;

export function mapCheckoutStart(result: CheckoutStartResult): CheckoutStartData {
  return {
    orderId: result.order_id,
    totalPrice: result.total_price,
    totalCount: result.total_count,
    totalDeposit: result.total_deposit,
    totalSavings: result.total_savings,
    transactionExpiry: result.transaction_expiry,
  };
}

export function mapPaymentProfile(profile: PaymentProfile): PaymentProfileData {
  return {
    preferredPaymentOptionId: profile.preferred_payment_option_id,
    storedOptions: (profile.stored_payment_options ?? []).map((option) => ({
      id: option.id,
      displayName: option.display_name,
      account: option.account || null,
      paymentMethod: option.payment_method,
      iconUrl: option.icon_url,
    })),
  };
}
