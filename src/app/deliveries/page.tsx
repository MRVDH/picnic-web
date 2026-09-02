"use client";

import { useCallback, useEffect, useState } from "react";

import { DeliveryList } from "@/components/delivery/delivery-list";
import { ParcelList } from "@/components/delivery/parcel-list";
import { SharedHeader } from "@/components/layout/shared-header";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type {
  DeliveriesApiResponse,
  DeliveryListItem,
  ParcelItem,
  ParcelsApiResponse,
} from "@/lib/core/delivery-types";
import type { ApiErrorResponse } from "@/lib/core/types";

/** "ALL" fetches without a status filter; the others map to Picnic's status filter. */
type DeliveryTab = "ALL" | "CURRENT" | "COMPLETED" | "CANCELLED";

type ListState =
  | { status: "loading" }
  | { status: "success"; deliveries: DeliveryListItem[] }
  | { status: "error"; message: string };

const TABS: DeliveryTab[] = ["ALL", "CURRENT", "COMPLETED", "CANCELLED"];

/** Tabs that can contain CURRENT deliveries, for which we poll live-tracking availability. */
const TABS_WITH_CURRENT: ReadonlySet<DeliveryTab> = new Set(["ALL", "CURRENT"]);

const EMPTY_LIVE_TRACKING_IDS: ReadonlySet<string> = new Set();

export default function DeliveriesPage() {
  const t = useTranslations();
  usePageTitle(t.deliveriesTitle);

  const [activeTab, setActiveTab] = useState<DeliveryTab>("ALL");
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [liveTrackingIds, setLiveTrackingIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();

    const url = activeTab === "ALL" ? "/api/deliveries" : `/api/deliveries?status=${activeTab}`;
    fetch(url, { signal: controller.signal })
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
    if (listState.status !== "success" || !TABS_WITH_CURRENT.has(activeTab)) return;

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
    listState.status === "success" && TABS_WITH_CURRENT.has(activeTab)
      ? liveTrackingIds
      : EMPTY_LIVE_TRACKING_IDS;

  const handleRetry = useCallback(() => {
    setListState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  const EMPTY_MESSAGES: Record<DeliveryTab, string> = {
    ALL: t.deliveriesEmptyAll,
    CURRENT: t.deliveriesEmptyCurrent,
    COMPLETED: t.deliveriesEmptyCompleted,
    CANCELLED: t.deliveriesEmptyCancelled,
  };

  const TAB_LABELS: Record<DeliveryTab, string> = {
    ALL: t.deliveriesTabAll,
    CURRENT: t.deliveriesTabCurrent,
    COMPLETED: t.deliveriesTabCompleted,
    CANCELLED: t.deliveriesTabCancelled,
  };

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
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {listState.status === "loading" && <LoadingSpinner />}

        {listState.status === "error" && (
          <ErrorView message={listState.message} onRetry={handleRetry} />
        )}

        {listState.status === "success" && deliveries.length === 0 && (
          <p className="text-text-muted text-sm">{EMPTY_MESSAGES[activeTab]}</p>
        )}

        {listState.status === "success" && deliveries.length > 0 && (
          <DeliveryList deliveries={deliveries} liveTrackingIds={visibleLiveTrackingIds} />
        )}

        <ParcelList parcels={parcels} />
      </main>
    </div>
  );
}
