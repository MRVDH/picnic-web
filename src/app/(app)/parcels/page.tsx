"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PackageIcon } from "@/components/ui/package-icon";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { ParcelRow, ParcelsApiResponse, ParcelsPageData } from "@/lib/core/delivery-types";
import type { ApiErrorResponse } from "@/lib/core/types";

type PageState =
  | { status: "loading" }
  | { status: "success"; page: ParcelsPageData }
  | { status: "error"; message: string };

/**
 * The Pakketservice page, mirroring the app's parcels-overview-page-root.
 * Every text comes from Picnic; the parcel detail page and registering a
 * parcel aren't on the web yet, so rows aren't links and the button is disabled.
 */
export default function ParcelsPage() {
  const t = useTranslations();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  usePageTitle(state.status === "success" ? state.page.title : t.accountParcels);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/parcels", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ParcelsApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setState({ status: "error", message: data.error });
          return;
        }
        setState({ status: "success", page: data });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", message: t.parcelsLoadError });
      });

    return () => controller.abort();
  }, [retryCount, t.parcelsLoadError]);

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={handleRetry} />}
        {state.status === "success" && <ParcelsContent page={state.page} />}
      </main>
    </div>
  );
}

function ParcelsContent({ page }: { page: ParcelsPageData }) {
  const t = useTranslations();
  const hasParcels = page.sections.some((section) => section.parcels.length > 0);

  return (
    <>
      <h1 className="text-foreground text-2xl font-bold">{page.title || t.accountParcels}</h1>
      {page.subtitle && <p className="text-foreground mt-1">{page.subtitle}</p>}

      {!hasParcels && <p className="text-text-muted mt-8 text-sm">{t.parcelsEmpty}</p>}

      {page.sections.map((section, index) =>
        section.parcels.length === 0 ? null : (
          <section key={`${section.title}-${index}`} className="mt-8">
            {section.title && (
              <h2 className="text-foreground mb-2 text-lg font-bold">{section.title}</h2>
            )}
            <ul className="divide-card-border divide-y">
              {section.parcels.map((parcel) => (
                <ParcelListRow key={parcel.id} parcel={parcel} />
              ))}
            </ul>
          </section>
        )
      )}

      {page.action && (
        <button
          type="button"
          disabled
          title={t.comingSoon}
          className="mt-10 w-full cursor-not-allowed rounded-xl bg-[#295813] px-4 py-3 text-white opacity-60"
        >
          {page.action.label}
        </button>
      )}
    </>
  );
}

function ParcelListRow({ parcel }: { parcel: ParcelRow }) {
  return (
    <li className="flex items-start gap-3 py-4">
      <span className="text-foreground mt-0.5 shrink-0" aria-hidden="true">
        <PackageIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground font-medium">{parcel.name}</p>
        <p className="text-text-muted mt-1 text-sm">
          <span style={{ color: parcel.statusColor ?? undefined }}>{parcel.statusText}</span>
          {parcel.dateText && <> · {parcel.dateText}</>}
        </p>
      </div>
    </li>
  );
}
