"use client";

import React, { use, useCallback, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SharedHeader } from "@/components/shared-header";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { buildImageUrl, buildRecipeImageUrl } from "@/lib/image-url";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse, CountryCode, NutritionRow, RecipeDetail, RecipeIngredient } from "@/lib/types";

const PLACEHOLDER = "/placeholder-product.svg";

type PageState =
  | { status: "loading" }
  | { status: "success"; recipe: RecipeDetail }
  | { status: "error"; message: string };

type AddState = "idle" | "adding" | "done";

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split("**");
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}

// ─── Nutrition table ──────────────────────────────────────────────────────────

function RecipeNutritionTable({ rows }: { rows: NutritionRow[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
            <td
              className={`py-1.5 text-gray-600 ${row.isCategory ? "pl-3 font-medium" : "pl-6 text-xs text-gray-500"}`}
            >
              {row.label}
            </td>
            <td className="py-1.5 pr-3 text-right font-medium text-gray-800">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Hero image ───────────────────────────────────────────────────────────────

function HeroImage({ imageId, countryCode, alt }: { imageId: string; countryCode: CountryCode; alt: string }) {
  const [show, setShow] = useState(true);
  if (!show) return <div className="aspect-video w-full bg-gray-100" />;
  return (
    <div className="relative aspect-video w-full">
      <Image
        src={buildRecipeImageUrl(imageId, countryCode)}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        priority
        onError={() => setShow(false)}
      />
    </div>
  );
}

// ─── Ingredient row ───────────────────────────────────────────────────────────

/**
 * Scale the "(100 g benötigt)" string from the API by the current portion ratio.
 * Handles integers and decimals; formats back with comma if fractional.
 */
function scaleNeededText(text: string, portions: number, basePortion: number): string {
  if (basePortion === 0) return text;
  const m = /^\((\d+(?:[.,]\d+)?)\s+(.+)\)$/.exec(text);
  if (!m) return text;
  const num = parseFloat(m[1].replace(",", "."));
  const scaled = (num * portions) / basePortion;
  const scaledStr = Number.isInteger(scaled)
    ? String(scaled)
    : scaled.toFixed(1).replace(".", ",");
  return `(${scaledStr} ${m[2]})`;
}

function IngredientRow({
  ingredient,
  qty,
  portions,
  basePortion,
  checked,
  onToggle,
}: {
  ingredient: RecipeIngredient;
  qty: number;
  portions: number;
  basePortion: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const countryCode = useCountryCode();
  const [imgSrc, setImgSrc] = useState(
    ingredient.imageId ? buildImageUrl(ingredient.imageId, countryCode) : PLACEHOLDER
  );

  const scaledNeeded = ingredient.recipeQuantityText
    ? scaleNeededText(ingredient.recipeQuantityText, portions, basePortion)
    : null;

  const displayPkg = ingredient.recipePackageSize ?? ingredient.unitQuantity;
  const packageLabel = qty > 1 ? `${qty} × ${displayPkg}` : displayPkg;
  const subtitle = scaledNeeded ? `${packageLabel} ${scaledNeeded}` : packageLabel;

  // Effective unit price: use the best matching bundle tier when qty qualifies
  const bundleTier = ingredient.priceRanges
    ?.filter((t) => t.quantity <= qty)
    .at(-1);
  const effectiveUnitPrice = bundleTier ? bundleTier.pricePerUnit : ingredient.displayPrice;
  const totalPrice = effectiveUnitPrice * qty;

  // Crossed-out price: only shown when there is a genuine saving (strikethrough > effective).
  const rawStrikethrough =
    bundleTier
      ? ingredient.displayPrice * qty
      : ingredient.originalPrice !== null
        ? ingredient.originalPrice * qty
        : null;
  const strikethroughTotal = rawStrikethrough !== null && rawStrikethrough > totalPrice ? rawStrikethrough : null;

  const onSale = strikethroughTotal !== null;

  return (
    <div className={`flex items-center gap-3 py-3 ${onSale ? "-mx-4 rounded-lg bg-yellow-50 px-4" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={`shrink-0 h-5 w-5 rounded border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-picnic-red focus:ring-offset-1 flex items-center justify-center ${
          checked
            ? "border-picnic-red bg-picnic-red"
            : "border-gray-300 bg-white"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imgSrc}
          alt={ingredient.name}
          fill
          unoptimized
          className={`object-contain p-1 transition-opacity ${checked ? "" : "opacity-40"}`}
          onError={() => { if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER); }}
        />
      </div>
      <div className={`min-w-0 flex-1 transition-opacity ${checked ? "" : "opacity-40"}`}>
        <p className="text-text-dark truncate text-sm font-medium">{ingredient.name}</p>
        <p className="text-text-muted text-xs">{subtitle}</p>
      </div>
      <div className={`shrink-0 text-right transition-opacity ${checked ? "" : "opacity-40"}`}>
        <p className={`text-sm font-medium ${onSale ? "text-amber-600" : "text-text-dark"}`}>{formatPrice(totalPrice)}</p>
        {onSale && (
          <p className="text-xs text-gray-400 line-through">{formatPrice(strikethroughTotal)}</p>
        )}
      </div>
    </div>
  );
}

// ─── Inner page (needs cart context) ─────────────────────────────────────────

function RecipeDetailInner({ recipeId }: { recipeId: string }) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const { refresh } = useCart();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [portions, setPortions] = useState(2);
  const [addState, setAddState] = useState<AddState>("idle");
  const [confirmedPortions, setConfirmedPortions] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());

  usePageTitle(pageState.status === "success" ? pageState.recipe.name : t.cookbookTitle);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/recipe/${encodeURIComponent(recipeId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: RecipeDetail & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.error === "Your token has expired") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setPageState({ status: "error", message: data.error });
          return;
        }
        const recipe = data as RecipeDetail;
        const p = recipe.portions ?? 2;
        setConfirmedPortions(p);
        setPortions(p);
        setPageState({ status: "success", recipe });
        setCheckedIds(new Set(recipe.ingredients.filter((i) => !i.isCondiment).map((i) => i.id)));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPageState({ status: "error", message: t.recipeLoadError });
      });
    return () => controller.abort();
  }, [recipeId, t.recipeLoadError]);

  useEffect(() => {
    if (pageState.status !== "success") return;
    if (confirmedPortions === null || confirmedPortions === portions) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/recipe/${encodeURIComponent(recipeId)}?portions=${portions}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: RecipeDetail & Partial<ApiErrorResponse>) => {
          if (!("error" in data) || !data.error) {
            const fetched = data as RecipeDetail;
            setConfirmedPortions(portions);
            setPageState((prev) =>
              prev.status === "success"
                ? {
                    status: "success",
                    recipe: {
                      ...prev.recipe,
                      portions: fetched.portions,
                      ingredients: fetched.ingredients,
                      steps: fetched.steps,
                      stepsPortionWarning: fetched.stepsPortionWarning,
                      recipeNutritionRows: fetched.recipeNutritionRows,
                    },
                  }
                : prev
            );
            setCheckedIds(new Set(fetched.ingredients.filter((i) => !i.isCondiment).map((i) => i.id)));
          }
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
        });
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [portions, confirmedPortions, pageState.status, recipeId]);

  const handleAddToCart = useCallback(async () => {
    if (pageState.status !== "success" || addState !== "idle") return;
    setAddState("adding");
    const { recipe } = pageState;
    const selectedIngredients = recipe.ingredients
      .filter((ing) => checkedIds.has(ing.id))
      .map((ing) => ({
        id: ing.id,
        count: Math.max(1, Math.ceil((ing.quantity * portions) / recipe.portions)),
      }));
    try {
      const res = await fetch(`/api/recipe/${encodeURIComponent(recipeId)}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portions, selectedIngredients }),
      });
      if (!res.ok) { setAddState("idle"); return; }
      refresh();
      setAddState("done");
      setTimeout(() => setAddState("idle"), 2500);
    } catch {
      setAddState("idle");
    }
  }, [pageState, addState, portions, recipeId, refresh, checkedIds]);

  if (pageState.status === "loading") {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (pageState.status === "error") {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          <ErrorView message={pageState.message} onRetry={() => setPageState({ status: "loading" })} />
        </main>
      </div>
    );
  }

  const { recipe } = pageState;
  const mainIngredients = recipe.ingredients.filter((i) => !i.isCondiment);
  const condiments = recipe.ingredients.filter((i) => i.isCondiment);
  const ingredientsRefreshing = confirmedPortions !== null && confirmedPortions !== portions;

  const pricePortions = ingredientsRefreshing ? (confirmedPortions ?? portions) : portions;
  const totalCents = mainIngredients.reduce((sum, ing) => {
    const qty = Math.max(1, Math.ceil((ing.quantity * pricePortions) / recipe.portions));
    const bundleTier = ing.priceRanges?.filter((t) => t.quantity <= qty).at(-1);
    const unitPrice = bundleTier ? bundleTier.pricePerUnit : ing.displayPrice;
    return sum + unitPrice * qty;
  }, 0);
  const pricePerServing = pricePortions > 0 ? formatPrice(Math.round(totalCents / pricePortions)) : null;

  const buttonLabel =
    addState === "adding" ? t.recipeAddingToCart
    : addState === "done" ? t.recipeAddedToCart
    : t.recipeAddToCart;

  const { confirmed, mayContain } = recipe.allergens;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {/* Back link */}
        <Link
          href="/cookbook"
          className="text-text-muted hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
        >
          ← {t.cookbookTitle}
        </Link>

        {/* Hero image */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gray-50">
          {recipe.imageId ? (
            <HeroImage imageId={recipe.imageId} countryCode={countryCode} alt={recipe.name} />
          ) : (
            <div className="aspect-video w-full bg-gray-100" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-foreground mb-3 text-2xl font-bold">{recipe.name}</h1>

        {/* Meta: portions · price per serving · total · cooking time */}
        <div className="text-text-muted mb-6 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            {t.recipePortions}:{" "}
            <button
              type="button"
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs transition-colors hover:border-gray-500"
            >
              −
            </button>
            <span className="mx-1 font-medium text-foreground">{portions}</span>
            <button
              type="button"
              onClick={() => setPortions((p) => p + 1)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs transition-colors hover:border-gray-500"
            >
              +
            </button>
          </span>
          {pricePerServing && (
            <span className={`transition-opacity duration-150 ${ingredientsRefreshing ? "opacity-40" : ""}`}>
              <span className="font-medium text-foreground">{pricePerServing}</span>{" "}
              <span className="text-gray-400">{t.recipePricePerServing}</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-medium text-foreground">{formatPrice(totalCents)}</span>{" "}
              <span className="text-gray-400">{t.recipePriceTotal}</span>
              {recipe.cookingTimeMinutes !== null && (
                <>
                  <span className="mx-1.5 text-gray-300">·</span>
                  <span>⏱ {recipe.cookingTimeMinutes} {t.cookingTimeMinutes}</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Add to cart */}
        {mainIngredients.length > 0 && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addState !== "idle" || ingredientsRefreshing || checkedIds.size === 0}
            className={`mb-8 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              addState === "done"
                ? "bg-green-500 focus:ring-green-500"
                : "bg-picnic-red hover:bg-red-700 focus:ring-picnic-red disabled:opacity-60"
            }`}
          >
            {buttonLabel}
          </button>
        )}

        {/* Refreshable content: ingredients, steps, nutrition */}
        <div className="relative">
          {ingredientsRefreshing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="border-t-picnic-red h-8 w-8 animate-spin rounded-full border-4 border-gray-200" />
            </div>
          )}
          <div className={`transition-opacity duration-150 ${ingredientsRefreshing ? "pointer-events-none opacity-40" : ""}`}>
            {mainIngredients.length > 0 && (
              <section className="mb-6">
                <h2 className="text-foreground mb-2 text-base font-semibold">{t.recipeIngredients}</h2>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-4">
                  {mainIngredients.map((ing) => (
                    <IngredientRow
                      key={ing.id}
                      ingredient={ing}
                      qty={Math.max(1, Math.ceil((ing.quantity * pricePortions) / recipe.portions))}
                      portions={pricePortions}
                      basePortion={recipe.portions}
                      checked={checkedIds.has(ing.id)}
                      onToggle={() => setCheckedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(ing.id)) next.delete(ing.id);
                        else next.add(ing.id);
                        return next;
                      })}
                    />
                  ))}
                </div>
              </section>
            )}
            {condiments.length > 0 && (
              <section className="mb-6">
                <h2 className="text-text-muted mb-2 text-sm font-medium">{t.recipeCondiments}</h2>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 px-4">
                  {condiments.map((ing) => (
                    <IngredientRow
                      key={ing.id}
                      ingredient={ing}
                      qty={Math.max(1, Math.ceil((ing.quantity * pricePortions) / recipe.portions))}
                      portions={pricePortions}
                      basePortion={recipe.portions}
                      checked={checkedIds.has(ing.id)}
                      onToggle={() => setCheckedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(ing.id)) next.delete(ing.id);
                        else next.add(ing.id);
                        return next;
                      })}
                    />
                  ))}
                </div>
              </section>
            )}
            {recipe.steps.length > 0 && (
              <section className="mb-6">
                <h2 className="text-foreground mb-3 text-base font-semibold">{t.recipeSteps}</h2>
                {recipe.stepsPortionWarning && (
                  <p className="mb-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
                    {recipe.stepsPortionWarning}
                  </p>
                )}
                <ol className="space-y-4">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="bg-picnic-red mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="text-text-dark text-sm leading-relaxed">{renderInlineMarkdown(step)}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {recipe.recipeNutritionRows.length > 0 && (
              <section className="mb-6">
                <h2 className="text-foreground mb-2 text-base font-semibold">{t.recipeNutrition}</h2>
                <p className="text-text-muted mb-2 text-xs">{t.recipePricePerServing}</p>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <RecipeNutritionTable rows={recipe.recipeNutritionRows} />
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Allergens */}
        {(confirmed.length > 0 || mayContain.length > 0) && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            {confirmed.length > 0 && (
              <div className={mayContain.length > 0 ? "mb-4" : ""}>
                <p className="text-text-dark mb-2 text-sm font-semibold">{t.recipeAllergens}</p>
                <div className="flex flex-wrap gap-1.5">
                  {confirmed.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {mayContain.length > 0 && (
              <div>
                <p className="text-text-muted mb-2 text-sm font-medium">{t.recipeMayContain}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mayContain.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CartProvider>
      <RecipeDetailInner recipeId={id} />
    </CartProvider>
  );
}
