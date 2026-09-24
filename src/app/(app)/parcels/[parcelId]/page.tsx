"use client";

import { use, useCallback, useEffect, useState } from "react";

import { CartToast } from "@/components/cart/cart-toast";
import { BackLink } from "@/components/ui/back-link";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type {
  ParcelDetailApiResponse,
  ParcelDetailData,
  ParcelTrackingStep,
} from "@/lib/core/delivery-types";
import type { ApiErrorResponse } from "@/lib/core/types";

type PageState =
  | { status: "loading" }
  | { status: "success"; parcel: ParcelDetailData }
  | { status: "error"; message: string };

/** Space between the markers' columns and the step texts, like the app. */
const MARKER_COLUMN_WIDTH = 28;

/**
 * One parcel's tracking page, mirroring the app's parcel-tracking-page-root.
 * Every text and the timeline markers come from Picnic. The "Pakketje volgen"
 * button (a redirect to the carrier's site) is left out for now.
 */
export default function ParcelDetailPage({ params }: { params: Promise<{ parcelId: string }> }) {
  const { parcelId } = use(params);
  const t = useTranslations();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  usePageTitle(state.status === "success" ? state.parcel.title : t.accountParcels);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/parcels/${encodeURIComponent(parcelId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ParcelDetailApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setState({ status: "error", message: data.error });
          return;
        }
        setState({ status: "success", parcel: data });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", message: t.parcelsLoadError });
      });

    return () => controller.abort();
  }, [parcelId, retryCount, t.parcelsLoadError]);

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <BackLink fallbackHref="/parcels">{t.backButton}</BackLink>

        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={handleRetry} />}
        {state.status === "success" && <ParcelDetail parcel={state.parcel} />}
      </main>
    </div>
  );
}

function ParcelDetail({ parcel }: { parcel: ParcelDetailData }) {
  const t = useTranslations();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(parcel.shipmentNumber);
      if (parcel.copiedMessage) setToastMessage(parcel.copiedMessage);
    } catch {
      // Clipboard access can be denied; the number stays selectable on the page.
    }
  }, [parcel.shipmentNumber, parcel.copiedMessage]);

  return (
    <>
      <h1 className="text-foreground text-2xl font-semibold">{parcel.title}</h1>

      {parcel.shipmentNumber && (
        <p className="text-foreground mt-2 flex items-center gap-2">
          <span>
            {parcel.shipmentLabel}{" "}
            <span className="font-medium select-all">{parcel.shipmentNumber}</span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={t.parcelCopyShipmentNumber}
            title={t.parcelCopyShipmentNumber}
            className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <CopyIcon />
          </button>
        </p>
      )}

      {parcel.steps.length > 0 && (
        <ol className="mt-6 rounded-2xl border border-[#c9c6c3] bg-[#fcfaf9] px-6 py-4">
          {parcel.steps.map((step, index) => (
            <TrackingStep key={`${step.title}-${index}`} step={step} />
          ))}
        </ol>
      )}

      {parcel.footerText && (
        <p className="text-foreground mx-auto mt-16 max-w-sm text-center">{parcel.footerText}</p>
      )}

      <CartToast message={toastMessage} onDismiss={dismissToast} />
    </>
  );
}

/** A step: a colored marker (with checkmark when done), the line to the next step, and the texts. */
function TrackingStep({ step }: { step: ParcelTrackingStep }) {
  return (
    <li className="flex gap-5">
      <div className="flex shrink-0 flex-col items-center" style={{ width: MARKER_COLUMN_WIDTH }}>
        <span
          className="flex items-center justify-center rounded-full text-white"
          style={{
            width: step.markerSize,
            height: step.markerSize,
            backgroundColor: step.markerColor ?? "#c9c6c3",
          }}
        >
          {step.done && <CheckIcon size={Math.round(step.markerSize * 0.6)} />}
        </span>
        {step.lineColor && (
          <span
            className="w-px flex-1"
            style={{ backgroundColor: step.lineColor, minHeight: 40 }}
          />
        )}
      </div>
      <div className={`min-w-0 flex-1 ${step.lineColor ? "pb-6" : ""}`}>
        <p className="text-foreground font-bold">{step.title}</p>
        {step.dateText && <p className="text-foreground mt-0.5 text-sm">{step.dateText}</p>}
      </div>
    </li>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth={1.8}
      />
    </svg>
  );
}
