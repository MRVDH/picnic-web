"use client";

import { useCallback, useEffect, useState } from "react";

import Image from "next/image";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import { formatEuroPrice } from "@/lib/core/format-price";
import { buildImageUrl } from "@/lib/core/image-url";
import type {
  ApiErrorResponse,
  CountryCode,
  IngredientAlternative,
  IngredientEditData,
} from "@/lib/core/types";

const PLACEHOLDER = "/placeholder-product.svg";

type IngredientEditModalProps = {
  recipeId: string;
  ingredientId: string;
  portions: number;
  onClose: () => void;
  onSaved: () => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: IngredientEditData }
  | { status: "error"; message: string };

export function IngredientEditModal({
  recipeId,
  ingredientId,
  portions,
  onClose,
  onSaved,
}: IngredientEditModalProps) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/recipe/${encodeURIComponent(recipeId)}/ingredient/${encodeURIComponent(
        ingredientId
      )}?portions=${portions}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data: IngredientEditData & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.error === "Your token has expired") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setLoadState({ status: "error", message: t.recipeEditLoadError });
          return;
        }
        setLoadState({ status: "ready", data });
        setQuantities({ ...data.selected });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadState({ status: "error", message: t.recipeEditLoadError });
      });
    return () => controller.abort();
  }, [recipeId, ingredientId, portions, t.recipeEditLoadError]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const select = useCallback((alternative: IngredientAlternative) => {
    if (alternative.isUnavailable) return;
    // Picking a different product replaces the selection, as the app does.
    setQuantities({ [alternative.id]: 1 });
  }, []);

  const setCount = useCallback((id: string, delta: number) => {
    setQuantities((prev) => {
      // Only touch this unit: a saved selection can hold several units at once.
      const { [id]: current = 0, ...rest } = prev;
      const next = Math.max(0, current + delta);
      return next === 0 ? rest : { ...rest, [id]: next };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `/api/recipe/${encodeURIComponent(recipeId)}/ingredient/${encodeURIComponent(ingredientId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portions, quantities }),
        }
      );
      if (!res.ok) {
        setSaveError(t.recipeEditSaveError);
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setSaveError(t.recipeEditSaveError);
      setSaving(false);
    }
  }, [saving, recipeId, ingredientId, portions, quantities, onSaved, t.recipeEditSaveError]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-edit-title"
        className="bg-card-bg flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 id="ingredient-edit-title" className="text-foreground text-lg font-bold">
            {t.recipeEditIngredient}
          </h2>
          {loadState.status === "ready" && loadState.data.subtitle && (
            <p className="text-text-muted mt-1 text-sm">{loadState.data.subtitle}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {loadState.status === "loading" && <LoadingSpinner />}
          {loadState.status === "error" && (
            <p className="py-8 text-center text-sm text-red-600">{loadState.message}</p>
          )}
          {loadState.status === "ready" &&
            loadState.data.groups.map((group) => (
              <section key={group.title} className="py-3">
                <h3 className="text-text-muted mb-2 text-sm font-medium">{group.title}</h3>
                <div className="divide-y divide-gray-100">
                  {group.alternatives.map((alternative) => (
                    <AlternativeRow
                      key={alternative.id}
                      alternative={alternative}
                      countryCode={countryCode}
                      count={quantities[alternative.id] ?? 0}
                      unavailableLabel={t.recipeEditUnavailable}
                      addLabel={t.addOneAriaLabel}
                      removeLabel={t.removeOneAriaLabel}
                      onSelect={() => select(alternative)}
                      onIncrement={() => setCount(alternative.id, 1)}
                      onDecrement={() => setCount(alternative.id, -1)}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          {saveError && <p className="mb-2 text-center text-sm text-red-600">{saveError}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t.recipeEditCancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadState.status !== "ready"}
              className="bg-picnic-red focus:ring-picnic-red flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? t.recipeEditSaving : t.recipeEditSave}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AlternativeRowProps = {
  alternative: IngredientAlternative;
  countryCode: CountryCode;
  count: number;
  unavailableLabel: string;
  addLabel: string;
  removeLabel: string;
  onSelect: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

function AlternativeRow({
  alternative,
  countryCode,
  count,
  unavailableLabel,
  addLabel,
  removeLabel,
  onSelect,
  onIncrement,
  onDecrement,
}: AlternativeRowProps) {
  const [imgSrc, setImgSrc] = useState(
    alternative.imageId ? buildImageUrl(alternative.imageId, countryCode) : PLACEHOLDER
  );
  const onSale = alternative.originalPrice !== null;
  const selected = count > 0;

  return (
    <div
      className={`flex items-center gap-3 py-3 ${onSale ? "-mx-2 rounded-lg bg-yellow-50 px-2" : ""} ${
        alternative.isUnavailable ? "opacity-60" : ""
      }`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imgSrc}
          alt={alternative.name}
          fill
          unoptimized
          className="object-contain p-1"
          onError={() => {
            if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER);
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-text-dark truncate text-sm font-medium">{alternative.name}</p>
        {alternative.brand && <p className="text-text-muted text-xs">{alternative.brand}</p>}
        {alternative.isUnavailable ? (
          <p className="text-xs text-red-600">
            {alternative.unavailableReason ?? unavailableLabel}
          </p>
        ) : (
          <p className="text-sm">
            <span className={onSale ? "font-medium text-amber-600" : "text-text-dark font-medium"}>
              {formatEuroPrice(alternative.displayPrice)}
            </span>
            {alternative.originalPrice !== null && (
              <span className="ml-1.5 text-xs text-gray-400 line-through">
                {formatEuroPrice(alternative.originalPrice)}
              </span>
            )}
          </p>
        )}
        <p className="text-text-muted text-xs">
          {[alternative.unitQuantity, ...alternative.tags].filter(Boolean).join(" · ")}
        </p>
      </div>

      {selected ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onDecrement}
            aria-label={removeLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-sm"
          >
            −
          </button>
          <span className="text-foreground w-4 text-center text-sm font-medium">{count}</span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label={addLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-sm"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          role="radio"
          aria-checked={false}
          aria-label={alternative.name}
          disabled={alternative.isUnavailable}
          onClick={onSelect}
          className="h-6 w-6 shrink-0 rounded-full border-2 border-gray-300 disabled:opacity-40"
        />
      )}
    </div>
  );
}
