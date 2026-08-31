"use client";

import dynamic from "next/dynamic";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import type { DeliveryTrackingData } from "@/lib/core/delivery-types";
import { formatDeliveryWindowText } from "@/lib/delivery/format-delivery-window";

const DeliveryTrackingMap = dynamic(
  () =>
    import("@/components/delivery/delivery-tracking-map").then((mod) => mod.DeliveryTrackingMap),
  { ssr: false, loading: () => <LoadingSpinner /> }
);

type DeliveryTrackingPanelProps = {
  tracking: DeliveryTrackingData | null;
  loading?: boolean;
};

export function DeliveryTrackingPanel({ tracking, loading = false }: DeliveryTrackingPanelProps) {
  const t = useTranslations();
  const countryCode = useCountryCode();

  if (loading) {
    return (
      <div className="border-card-border bg-card-bg rounded-xl border p-4">
        <LoadingSpinner />
        <p className="text-text-muted mt-2 text-center text-sm">{t.deliveriesTrackingLoading}</p>
      </div>
    );
  }

  if (!tracking) return null;

  const hasMap =
    tracking.route.length > 0 ||
    tracking.currentPosition !== null ||
    tracking.destination !== null;

  const etaWindow =
    tracking.etaWindowStart && tracking.etaWindowEnd
      ? formatDeliveryWindowText(tracking.etaWindowStart, tracking.etaWindowEnd, countryCode)
      : null;

  return (
    <div className="border-card-border bg-card-bg space-y-4 rounded-xl border p-4">
      {hasMap ? (
        <DeliveryTrackingMap tracking={tracking} />
      ) : (
        <p className="text-text-muted text-sm">{t.deliveriesTrackingNoMap}</p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        {tracking.vehicleImageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tracking.vehicleImageDataUrl}
            alt={tracking.vehicleName ?? ""}
            className="h-16 w-auto object-contain"
          />
        )}
        <div className="min-w-0 flex-1">
          {tracking.driverName && (
            <p className="text-foreground font-semibold">
              {t.deliveriesTrackingDriver}: {tracking.driverName}
            </p>
          )}
          {tracking.etaText && (
            <p className="text-picnic-green mt-1 font-semibold">{tracking.etaText}</p>
          )}
          {etaWindow && (
            <p className="text-text-muted mt-0.5 text-sm">
              {t.deliveriesTrackingEta}: {etaWindow}
            </p>
          )}
        </div>
        {tracking.driverPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tracking.driverPhotoUrl}
            alt={tracking.driverName ?? ""}
            className="h-14 w-14 rounded-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
