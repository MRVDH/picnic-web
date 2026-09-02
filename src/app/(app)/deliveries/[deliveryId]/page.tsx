"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CartItemCard } from "@/components/cart/cart-item";
import { CartToast } from "@/components/cart/cart-toast";
import { OrderSummary } from "@/components/cart/order-summary";
import { DeliveryRating } from "@/components/delivery/delivery-rating";
import { DeliveryTrackingPanel } from "@/components/delivery/delivery-tracking-panel";
import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "@/contexts/country-context";
import { useDeliveryTracking } from "@/hooks/use-delivery-tracking";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { DeliveryDetailData } from "@/lib/core/delivery-types";
import { formatPrice } from "@/lib/core/format-price";
import type { Translations } from "@/lib/core/i18n";
import type { ApiErrorResponse } from "@/lib/core/types";

type DetailState =
  | { status: "loading" }
  | { status: "success"; delivery: DeliveryDetailData }
  | { status: "error"; message: string };

function resolvePhaseLabel(
  delivery: DeliveryDetailData,
  scenarioInProgress: boolean,
  t: Translations
): string {
  if (delivery.status === "CANCELLED") return t.deliveriesStatusCancelled;
  if (delivery.status === "COMPLETED") return t.deliveriesStatusDelivered;
  if (scenarioInProgress) return t.deliveriesStatusEnRoute;
  return t.deliveriesStatusPlanned;
}

export default function DeliveryDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const deliveryId = typeof params.deliveryId === "string" ? params.deliveryId : "";

  usePageTitle(t.deliveriesDetailTitle);

  const [detailState, setDetailState] = useState<DetailState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rated, setRated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const delivery = detailState.status === "success" ? detailState.delivery : null;
  const trackingEnabled = delivery?.status === "CURRENT";

  const { tracking } = useDeliveryTracking({
    deliveryId,
    enabled: trackingEnabled,
  });

  const fetchDetail = useCallback(() => {
    if (!deliveryId) return;

    fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}`)
      .then((res) => res.json())
      .then((data: DeliveryDetailData & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setDetailState({ status: "error", message: data.error });
          return;
        }
        if (!data.id) {
          setDetailState({ status: "error", message: t.deliveriesDetailLoadError });
          return;
        }
        setDetailState({ status: "success", delivery: data });
      })
      .catch(() => {
        setDetailState({ status: "error", message: t.deliveriesDetailLoadError });
      });
  }, [deliveryId, t.deliveriesDetailLoadError]);

  useEffect(() => {
    setDetailState({ status: "loading" });
    fetchDetail();
  }, [fetchDetail, retryCount]);

  const handleCancel = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/cancel`, {
        method: "POST",
      });
      const data = (await res.json()) as Partial<ApiErrorResponse>;
      if (!res.ok || data.error) {
        setToast(t.deliveriesCancelError);
        return;
      }
      setToast(t.deliveriesCancelSuccess);
      setShowCancelModal(false);
      setRetryCount((c) => c + 1);
    } catch {
      setToast(t.deliveriesCancelError);
    } finally {
      setActionLoading(false);
    }
  }, [deliveryId, t.deliveriesCancelError, t.deliveriesCancelSuccess]);

  const handleRate = useCallback(
    async (rating: number) => {
      const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = (await res.json()) as Partial<ApiErrorResponse>;
      if (!res.ok || data.error) {
        setToast(
          data.error === "Delivery already rated" ? t.deliveriesRateAlready : t.deliveriesRateError
        );
        if (data.error === "Delivery already rated") setRated(true);
        return;
      }
      setRated(true);
      setToast(t.deliveriesRateSuccess);
    },
    [deliveryId, t.deliveriesRateAlready, t.deliveriesRateError, t.deliveriesRateSuccess]
  );

  const handleInvoice = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/invoice`, {
        method: "POST",
      });
      const data = (await res.json()) as Partial<ApiErrorResponse>;
      if (!res.ok || data.error) {
        setToast(t.deliveriesInvoiceError);
        return;
      }
      setToast(t.deliveriesInvoiceSuccess);
    } catch {
      setToast(t.deliveriesInvoiceError);
    } finally {
      setActionLoading(false);
    }
  }, [deliveryId, t.deliveriesInvoiceError, t.deliveriesInvoiceSuccess]);

  const scenarioInProgress = tracking.status === "ready" ? tracking.data.scenarioInProgress : false;

  const allItems = delivery?.orders.flatMap((o) => o.items) ?? [];
  const payment = delivery?.orders.find((o) => o.payment)?.payment ?? null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CartToast message={toast} onDismiss={() => setToast(null)} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-6">
          <Link
            href="/deliveries"
            className="text-picnic-red mb-4 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-red-700"
          >
            <BackArrowIcon />
            {t.deliveriesTitle}
          </Link>
          <h1 className="text-foreground text-2xl font-bold">{t.deliveriesDetailTitle}</h1>
        </div>

        {detailState.status === "loading" && <LoadingSpinner />}

        {detailState.status === "error" && (
          <ErrorView
            message={detailState.message}
            onRetry={() => {
              setDetailState({ status: "loading" });
              setRetryCount((c) => c + 1);
            }}
          />
        )}

        {delivery && (
          <div className="space-y-6">
            <div>
              <p className="text-foreground text-lg font-bold">
                {resolvePhaseLabel(delivery, scenarioInProgress, t)}
              </p>
              <p className="text-text-muted mt-1 text-sm">
                {t.deliveriesWindowTitle}: {delivery.deliveryWindowText}
              </p>
            </div>

            {delivery.status === "CURRENT" &&
              (tracking.status === "loading" ||
                (tracking.status === "ready" && tracking.data.scenarioInProgress)) && (
                <DeliveryTrackingPanel
                  tracking={tracking.status === "ready" ? tracking.data : null}
                  loading={tracking.status === "loading"}
                />
              )}

            <section>
              <h2 className="text-foreground mb-3 text-base font-semibold">
                {t.orderSummaryTitle}
              </h2>
              <div className="border-card-border bg-card-bg rounded-xl border px-4">
                {allItems.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            <OrderSummary
              totalPrice={delivery.totalPrice}
              totalCount={delivery.totalCount}
              totalDiscount={delivery.totalDiscount}
              depositTotal={delivery.depositTotal}
              depositBreakdown={delivery.depositBreakdown}
              membershipSavings={delivery.membershipSavings}
              fees={delivery.fees}
              minimumOrderValue={null}
            />

            {payment && (
              <section className="border-card-border bg-card-bg rounded-xl border p-4">
                <h2 className="text-foreground mb-2 text-base font-semibold">
                  {t.deliveriesPaymentTitle}
                </h2>
                {payment.paymentType && (
                  <p className="text-sm text-gray-700">
                    {t.deliveriesPaymentType}: {payment.paymentType}
                  </p>
                )}
                {payment.redactedIban && (
                  <p className="text-sm text-gray-700">{payment.redactedIban}</p>
                )}
              </section>
            )}

            {delivery.returnedContainers.length > 0 && (
              <section className="border-card-border bg-card-bg rounded-xl border p-4">
                <h2 className="text-foreground mb-2 text-base font-semibold">
                  {t.deliveriesReturnedContainers}
                </h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  {delivery.returnedContainers.map((item) => (
                    <li key={`${item.type}-${item.name}`} className="flex justify-between">
                      <span>
                        {item.name} ×{item.quantity}
                      </span>
                      <span>{formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap gap-3">
              {delivery.cancellable && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowCancelModal(true)}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {t.deliveriesCancelButton}
                </button>
              )}
              {(delivery.status === "COMPLETED" || delivery.status === "CURRENT") && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleInvoice()}
                  className="border-card-border rounded-md border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {t.deliveriesInvoiceButton}
                </button>
              )}
            </div>

            {delivery.status === "COMPLETED" && !rated && (
              <DeliveryRating onSubmit={handleRate} disabled={actionLoading} />
            )}
          </div>
        )}
      </main>

      {showCancelModal && (
        <ConfirmModal
          title={t.deliveriesCancelConfirmTitle}
          message={t.deliveriesCancelConfirmMessage}
          confirmLabel={t.confirmButton}
          cancelLabel={t.cancelButton}
          onConfirm={() => void handleCancel()}
          onCancel={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
}
