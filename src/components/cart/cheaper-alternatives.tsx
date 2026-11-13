"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { formatComparisonPrice, formatPrice, unitLabel } from "@/lib/core/format-price";
import { buildImageUrl } from "@/lib/core/image-url";
import type {
  ApiErrorResponse,
  CartItem,
  CheaperAlternative,
  CheaperAlternativesResponse,
} from "@/lib/core/types";

/** Show this many alternatives; the cheapest per unit come first. */
const MAX_ALTERNATIVES = 3;

type PanelState =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "open"; alternatives: CheaperAlternative[] };

type CheaperAlternativesProps = {
  item: CartItem;
  /** Swaps the cart line for the alternative, keeping the quantity. */
  onReplace: (item: CartItem, alternative: CheaperAlternative) => Promise<void>;
};

/**
 * A "Cheaper alternative?" button under a cart line. It loads the similar
 * products that cost less per kg, litre or piece only when pressed, since
 * each lookup is a request to Picnic.
 */
export function CheaperAlternatives({ item, onReplace }: CheaperAlternativesProps) {
  const t = useTranslations();
  const [state, setState] = useState<PanelState>({ status: "closed" });
  // One swap at a time: a second click would remove and add again.
  const [isReplacing, setIsReplacing] = useState(false);

  const replace = async (alternative: CheaperAlternative) => {
    setIsReplacing(true);
    try {
      await onReplace(item, alternative);
    } finally {
      setIsReplacing(false);
    }
  };

  if (!item.comparisonPrice) return null;
  const unit = item.comparisonPrice.unit;

  const toggle = async () => {
    if (state.status === "open" || state.status === "error") {
      setState({ status: "closed" });
      return;
    }
    setState({ status: "loading" });
    try {
      const response = await fetch(
        `/api/product/${encodeURIComponent(item.productId)}/alternatives`
      );
      const data: CheaperAlternativesResponse | ApiErrorResponse = await response.json();
      setState(
        response.ok && !("error" in data)
          ? { status: "open", alternatives: data.alternatives.slice(0, MAX_ALTERNATIVES) }
          : { status: "error" }
      );
    } catch {
      setState({ status: "error" });
    }
  };

  return (
    <div className="mt-2 pl-14">
      <button
        type="button"
        onClick={toggle}
        disabled={state.status === "loading"}
        aria-expanded={state.status === "open"}
        className="text-picnic-red text-sm hover:underline disabled:opacity-60"
      >
        {state.status === "open" ? t.hideCheaperAlternatives : t.findCheaperAlternative}
      </button>

      {state.status === "loading" && <p className="mt-1 text-sm text-gray-500">…</p>}
      {state.status === "error" && (
        <p className="mt-1 text-sm text-gray-500">{t.cheaperAlternativesError}</p>
      )}
      {state.status === "open" && state.alternatives.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">
          {t.noCheaperAlternative.replace("{unit}", unitLabel(unit, t))}
        </p>
      )}
      {state.status === "open" && state.alternatives.length > 0 && (
        <ul className="mt-2 space-y-2">
          {state.alternatives.map((alternative) => (
            <AlternativeRow
              key={alternative.id}
              alternative={alternative}
              disabled={isReplacing}
              onReplace={() => replace(alternative)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AlternativeRow({
  alternative,
  disabled,
  onReplace,
}: {
  alternative: CheaperAlternative;
  disabled: boolean;
  onReplace: () => void;
}) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const [imgError, setImgError] = useState(false);
  const { comparisonPrice } = alternative;

  return (
    <li className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
      <Link
        href={`/product/${alternative.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
      >
        <div className="relative h-12 w-12 shrink-0">
          <Image
            src={
              imgError || !alternative.imageId
                ? "/placeholder-product.svg"
                : buildImageUrl(alternative.imageId, countryCode)
            }
            alt={alternative.name}
            fill
            unoptimized
            className="object-contain"
            onError={() => setImgError(true)}
          />
        </div>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm">{alternative.name}</p>
          <p className="text-text-muted text-xs">
            {alternative.unitQuantity} · {formatPrice(alternative.displayPrice)} ·{" "}
            {formatComparisonPrice(comparisonPrice.price, comparisonPrice.unit, t)}
          </p>
          <p className="text-text-bio-green text-xs font-semibold">
            {t.cheaperBy.replace(
              "{price}",
              formatComparisonPrice(alternative.savingPerUnit, comparisonPrice.unit, t)
            )}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onReplace}
        disabled={disabled}
        aria-label={t.replaceInCartAriaLabel.replace("{name}", alternative.name)}
        className="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
      >
        {t.replaceInCart}
      </button>
    </li>
  );
}
