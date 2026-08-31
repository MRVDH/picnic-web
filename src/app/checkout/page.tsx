"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CartToast } from "@/components/cart/cart-toast";
import { CheckoutIssueModal } from "@/components/checkout/checkout-issue-modal";
import { CheckoutPaymentPanel } from "@/components/checkout/checkout-payment-panel";
import { OrderSummary } from "@/components/cart/order-summary";
import { DeliverySlotBanner } from "@/components/delivery/delivery-slot-banner";
import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SharedHeader } from "@/components/layout/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { CHECKOUT_STORAGE_KEY, TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import { isMinimumOrderMet } from "@/lib/cart/minimum-order";
import type {
  CheckoutIssueData,
  CheckoutStartData,
  PaymentProfileData,
} from "@/lib/core/checkout-types";
import type { ApiErrorResponse, CartData } from "@/lib/core/types";

type CheckoutSession = {
  orderId: string;
  transactionId: string;
};

type PageState =
  | { status: "loading" }
  | { status: "ready"; cart: CartData; paymentProfile: PaymentProfileData | null }
  | { status: "error"; message: string };

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  usePageTitle(t.checkoutPageTitle);

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [checkout, setCheckout] = useState<CheckoutStartData | null>(null);
  const [issue, setIssue] = useState<CheckoutIssueData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setPageState({ status: "loading" });

    try {
      const [cartRes, profileRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/cart/checkout/payment-profile"),
      ]);

      const cartData = (await cartRes.json()) as CartData | ApiErrorResponse;
      if ("error" in cartData && cartData.error) {
        if (cartData.code === "TOKEN_EXPIRED") {
          window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        setPageState({ status: "error", message: cartData.error });
        return;
      }

      const cart = cartData as CartData;

      if (cart.totalCount === 0) {
        router.replace("/cart");
        return;
      }

      if (!isMinimumOrderMet(cart.totalPrice, cart.minimumOrderValue)) {
        router.replace("/cart");
        return;
      }

      let paymentProfile: PaymentProfileData | null = null;
      if (profileRes.ok) {
        paymentProfile = (await profileRes.json()) as PaymentProfileData;
      }

      setPageState({ status: "ready", cart, paymentProfile });
    } catch {
      setPageState({ status: "error", message: t.checkoutLoadError });
    }
  }, [router, t.checkoutLoadError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const startCheckout = useCallback(
    async (resolveKey?: string) => {
      if (pageState.status !== "ready") return;

      setActionLoading(true);
      setIssue(null);

      try {
        const res = await fetch("/api/cart/checkout/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(resolveKey ? { resolveKey } : {}),
          }),
        });

        const data = (await res.json()) as
          | CheckoutStartData
          | { issue: CheckoutIssueData }
          | ApiErrorResponse;

        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setToast(data.error);
          return;
        }

        if ("issue" in data) {
          setIssue(data.issue);
          return;
        }

        setCheckout(data as CheckoutStartData);
      } catch {
        setToast(t.checkoutStartError);
      } finally {
        setActionLoading(false);
      }
    },
    [pageState, t.checkoutStartError]
  );

  const initiatePayment = useCallback(async () => {
    if (!checkout?.orderId) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/cart/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: checkout.orderId }),
      });

      const data = (await res.json()) as
        | { paymentId: string; transactionId: string; redirectUrl: string }
        | ApiErrorResponse;

      if ("error" in data && data.error) {
        setToast(data.error);
        return;
      }

      const payment = data as { paymentId: string; transactionId: string; redirectUrl: string };
      const session: CheckoutSession = {
        orderId: checkout.orderId,
        transactionId: payment.transactionId,
      };
      sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(session));

      window.location.href = payment.redirectUrl;
    } catch {
      setToast(t.checkoutPaymentError);
    } finally {
      setActionLoading(false);
    }
  }, [checkout, t.checkoutPaymentError]);

  const cancelCheckoutFlow = useCallback(async () => {
    setCheckout(null);
    setIssue(null);
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader />
      <CartToast message={toast} onDismiss={() => setToast(null)} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-6">
          <Link
            href="/cart"
            className="text-picnic-red mb-4 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-red-700"
          >
            <BackArrowIcon />
            {t.cartTitle}
          </Link>
          <h1 className="text-foreground text-2xl font-bold">{t.checkoutPageTitle}</h1>
        </div>

        {pageState.status === "loading" && <LoadingSpinner />}

        {pageState.status === "error" && (
          <ErrorView message={pageState.message} onRetry={() => void loadData()} />
        )}

        {pageState.status === "ready" && (
          <div className="space-y-6">
            <DeliverySlotBanner
              bannerText={pageState.cart.deliveryBannerText}
              isExplicit={pageState.cart.selectedSlot?.isExplicitSelection ?? false}
              onTap={() => router.push("/cart")}
            />

            <OrderSummary
              totalPrice={pageState.cart.totalPrice}
              totalCount={pageState.cart.totalCount}
              totalDiscount={pageState.cart.totalDiscount}
              depositTotal={pageState.cart.depositTotal}
              depositBreakdown={pageState.cart.depositBreakdown}
              membershipSavings={pageState.cart.membershipSavings}
              fees={pageState.cart.fees}
              minimumOrderValue={pageState.cart.minimumOrderValue}
            />

            {!checkout && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void startCheckout()}
                className="bg-picnic-red w-full rounded-xl py-4 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? t.checkoutProcessing : t.checkoutContinueButton}
              </button>
            )}

            {checkout && (
              <CheckoutPaymentPanel
                checkout={checkout}
                paymentProfile={pageState.paymentProfile}
                loading={actionLoading}
                onPay={() => void initiatePayment()}
                onCancel={() => void cancelCheckoutFlow()}
              />
            )}
          </div>
        )}
      </main>

      {issue && (
        <CheckoutIssueModal
          issue={issue}
          confirmLabel={t.confirmButton}
          cancelLabel={t.cancelButton}
          onConfirm={() => {
            if (issue.resolveKey) {
              void startCheckout(issue.resolveKey);
            } else {
              setIssue(null);
            }
          }}
          onCancel={() => setIssue(null)}
        />
      )}
    </div>
  );
}
