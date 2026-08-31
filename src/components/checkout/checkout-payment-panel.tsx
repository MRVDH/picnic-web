"use client";

import { useTranslations } from "@/contexts/country-context";
import { formatPrice } from "@/lib/core/format-price";
import type { CheckoutStartData, PaymentProfileData } from "@/lib/core/checkout-types";

type CheckoutPaymentPanelProps = {
  checkout: CheckoutStartData;
  paymentProfile: PaymentProfileData | null;
  loading: boolean;
  onPay: () => void;
  onCancel: () => void;
};

export function CheckoutPaymentPanel({
  checkout,
  paymentProfile,
  loading,
  onPay,
  onCancel,
}: CheckoutPaymentPanelProps) {
  const t = useTranslations();

  const preferred =
    paymentProfile?.storedOptions.find(
      (option) => option.id === paymentProfile.preferredPaymentOptionId
    ) ?? paymentProfile?.storedOptions[0];

  return (
    <div className="border-card-border bg-card-bg space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-foreground text-base font-semibold">{t.checkoutPaymentTitle}</h2>
        <p className="text-text-muted mt-1 text-sm">
          {t.checkoutOrderTotal}: {formatPrice(checkout.totalPrice)}
        </p>
        {checkout.transactionExpiry && (
          <p className="text-text-muted mt-0.5 text-xs">
            {t.checkoutExpires}: {new Date(checkout.transactionExpiry).toLocaleString()}
          </p>
        )}
      </div>

      {preferred && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3">
          {preferred.iconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preferred.iconUrl} alt="" className="h-8 w-8 object-contain" />
          )}
          <div>
            <p className="text-foreground text-sm font-medium">{preferred.displayName}</p>
            {preferred.account && (
              <p className="text-text-muted text-xs">{preferred.account}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={onPay}
          className="bg-picnic-red flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? t.checkoutProcessing : t.checkoutPayButton}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className="border-card-border rounded-xl border px-4 py-3 text-sm font-medium text-gray-700"
        >
          {t.cancelButton}
        </button>
      </div>
    </div>
  );
}
