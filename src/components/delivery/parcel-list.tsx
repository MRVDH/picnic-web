"use client";

import { PackageIcon } from "@/components/ui/package-icon";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import type { ParcelItem } from "@/lib/core/delivery-types";
import type { Translations } from "@/lib/core/i18n";
import { formatLongDate } from "@/lib/delivery/format-delivery-window";

type ParcelListProps = {
  parcels: ParcelItem[];
};

/** Statuses Picnic reports that we have a translation for; others are humanized. */
function resolveStatusLabel(status: string, t: Translations): { label: string; known: boolean } {
  if (status === "HANDED_OVER") return { label: t.deliveriesParcelStatusHandedOver, known: true };
  const humanized = status.toLowerCase().replace(/_/g, " ");
  return {
    label: humanized.charAt(0).toUpperCase() + humanized.slice(1),
    known: false,
  };
}

function ParcelRow({ parcel }: { parcel: ParcelItem }) {
  const t = useTranslations();
  const countryCode = useCountryCode();

  const name = t.deliveriesParcelName.replace("{carrier}", parcel.carrier || "—");
  const { label, known } = resolveStatusLabel(parcel.status, t);
  const date = formatLongDate(parcel.statusTimestamp, countryCode);

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-foreground shrink-0" aria-hidden="true">
        <PackageIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground font-semibold">{name}</p>
        <p className="text-text-muted mt-0.5 text-sm">
          <span className={known ? "text-picnic-green font-medium" : ""}>{label}</span>
          {date && <> · {date}</>}
        </p>
      </div>
    </li>
  );
}

function ParcelGroup({ title, parcels }: { title: string; parcels: ParcelItem[] }) {
  if (parcels.length === 0) return null;
  return (
    <div>
      <h3 className="text-foreground mb-2 text-sm font-semibold">{title}</h3>
      <ul className="border-card-border bg-card-bg divide-card-border divide-y rounded-xl border">
        {parcels.map((parcel) => (
          <ParcelRow key={parcel.id} parcel={parcel} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Parcel service overview, mirroring the app's "Pakketservice" screen: active
 * parcels first, processed ones below, each row showing carrier, status, and
 * the date of the last status change.
 */
export function ParcelList({ parcels }: ParcelListProps) {
  const t = useTranslations();
  if (parcels.length === 0) return null;

  const active = parcels.filter((p) => p.active);
  const processed = parcels.filter((p) => !p.active);

  return (
    <section className="mt-10">
      <h2 className="text-foreground text-xl font-bold">{t.deliveriesParcelsTitle}</h2>
      <p className="text-text-muted mb-5 text-sm">{t.deliveriesParcelsSubtitle}</p>
      <div className="space-y-6">
        <ParcelGroup title={t.deliveriesParcelsActive} parcels={active} />
        <ParcelGroup title={t.deliveriesParcelsProcessed} parcels={processed} />
      </div>
    </section>
  );
}
