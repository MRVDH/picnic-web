"use client";

import { useCallback, useEffect, useState } from "react";

import { DeliveryCard } from "@/components/delivery/delivery-card";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SharedHeader } from "@/components/layout/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type {
  DeliveryListItem,
  DeliveriesApiResponse,
  ParcelItem,
  ParcelsApiResponse,
} from "@/lib/core/delivery-types";
import type { ApiErrorResponse } from "@/lib/core/types";

type DeliveryTab = "CURRENT" | "COMPLETED" | "CANCELLED";

type ListState =
  | { status: "loading" }
  | { status: "success"; deliveries: DeliveryListItem[] }
  | { status: "error"; message: string };

const TABS: DeliveryTab[] = ["CURRENT", "COMPLETED", "CANCELLED"];

const EMPTY_LIVE_TRACKING_IDS: ReadonlySet<string> = new Set();

export default function DeliveriesPage() {
  const t = useTranslations();
  usePageTitle(t.deliveriesTitle);

  const [activeTab, setActiveTab] = useState<DeliveryTab>("CURRENT");
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [liveTrackingIds, setLiveTrackingIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/deliveries?status=${activeTab}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: DeliveriesApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setListState({ status: "error", message: data.error });
          return;
        }
        setListState({ status: "success", deliveries: data.deliveries ?? [] });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setListState({ status: "error", message: t.deliveriesLoadError });
      });

    return () => controller.abort();
  }, [activeTab, retryCount, t.deliveriesLoadError]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/parcels", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ParcelsApiResponse & Partial<ApiErrorResponse>) => {
        if ("parcels" in data && Array.isArray(data.parcels)) {
          setParcels(data.parcels);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [retryCount]);

  useEffect(() => {
    if (listState.status !== "success" || activeTab !== "CURRENT") return;

    const currentDeliveries = listState.deliveries.filter((d) => d.status === "CURRENT");
    const controller = new AbortController();

    void Promise.all(
      currentDeliveries.map(async (delivery) => {
        try {
          const res = await fetch(`/api/deliveries/${encodeURIComponent(delivery.id)}/position`, {
            signal: controller.signal,
          });
          const data = (await res.json()) as { scenario_in_progress?: boolean };
          return data.scenario_in_progress === true ? delivery.id : null;
        } catch {
          return null;
        }
      })
    ).then((ids) => {
      if (controller.signal.aborted) return;
      setLiveTrackingIds(new Set(ids.filter((id): id is string => id !== null)));
    });

    return () => controller.abort();
  }, [listState, activeTab]);

  const visibleLiveTrackingIds =
    listState.status === "success" && activeTab === "CURRENT"
      ? liveTrackingIds
      : EMPTY_LIVE_TRACKING_IDS;

  const handleRetry = useCallback(() => {
    setListState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  const emptyMessage =
    activeTab === "CURRENT"
      ? t.deliveriesEmptyCurrent
      : activeTab === "COMPLETED"
        ? t.deliveriesEmptyCompleted
        : t.deliveriesEmptyCancelled;

  const tabLabel = (tab: DeliveryTab) =>
    tab === "CURRENT"
      ? t.deliveriesTabCurrent
      : tab === "COMPLETED"
        ? t.deliveriesTabCompleted
        : t.deliveriesTabCancelled;

  const deliveries = listState.status === "success" ? listState.deliveries : [];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="text-foreground mb-6 text-2xl font-bold">{t.deliveriesTitle}</h1>

        <div className="mb-6 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setListState({ status: "loading" });
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-picnic-red text-white"
                  : "border-card-border border bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {listState.status === "loading" && <LoadingSpinner />}

        {listState.status === "error" && (
          <ErrorView message={listState.message} onRetry={handleRetry} />
        )}

        {listState.status === "success" && deliveries.length === 0 && (
          <p className="text-text-muted text-sm">{emptyMessage}</p>
        )}

        {listState.status === "success" && deliveries.length > 0 && (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                liveTrackingAvailable={visibleLiveTrackingIds.has(delivery.id)}
              />
            ))}
          </div>
        )}

        {parcels.length > 0 && (
          <section className="mt-10">
            <h2 className="text-foreground mb-3 text-base font-semibold">{t.deliveriesParcelsTitle}</h2>
            <div className="space-y-2">
              {parcels.map((parcel) => (
                <div
                  key={parcel.id}
                  className="border-card-border bg-card-bg flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="text-foreground font-medium">{parcel.carrier}</p>
                    <p className="text-text-muted text-sm">{parcel.status}</p>
                  </div>
                  {parcel.trackingUrl && (
                    <a
                      href={parcel.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-picnic-red text-sm font-medium hover:underline"
                    >
                      Track
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
