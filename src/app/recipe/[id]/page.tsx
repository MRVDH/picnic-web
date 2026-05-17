"use client";

import { use, useCallback, useEffect, useState } from "react";

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
}: {
  ingredient: RecipeIngredient;
  qty: number;
  portions: number;
  basePortion: number;
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

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imgSrc}
          alt={ingredient.name}
          fill
          unoptimized
          className="object-contain p-1"
          onError={() => { if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER); }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-text-dark truncate text-sm font-medium">{ingredient.name}</p>
        <p className="text-text-muted text-xs">{subtitle}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-text-dark text-sm font-medium">{formatPrice(ingredient.displayPrice * qty)}</p>
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
        setPageState({ status: "success", recipe: data as RecipeDetail });
        setPortions((data as RecipeDetail).portions ?? 2);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPageState({ status: "error", message: t.recipeLoadError });
      });
    return () => controller.abort();
  }, [recipeId, t.recipeLoadError]);

  const handleAddToCart = useCallback(async () => {
    if (pageState.status !== "success" || addState !== "idle") return;
    setAddState("adding");
    try {
      const res = await fetch(`/api/recipe/${encodeURIComponent(recipeId)}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portions }),
      });
      if (!res.ok) { setAddState("idle"); return; }
      refresh();
      setAddState("done");
      setTimeout(() => setAddState("idle"), 2500);
    } catch {
      setAddState("idle");
    }
  }, [pageState, addState, portions, recipeId, refresh]);

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

  const totalCents = mainIngredients.reduce((sum, ing) => {
    const qty = Math.max(1, Math.ceil((ing.quantity * portions) / recipe.portions));
    return sum + ing.displayPrice * qty;
  }, 0);
  const pricePerServing = portions > 0 ? formatPrice(Math.round(totalCents / portions)) : null;

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

        {/* Meta: time · portions · price per serving */}
        <div className="text-text-muted mb-6 flex flex-wrap items-center gap-4 text-sm">
          {recipe.cookingTimeMinutes !== null && (
            <span>⏱ {recipe.cookingTimeMinutes} {t.cookingTimeMinutes}</span>
          )}
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
              onClick={() => setPortions((p) => Math.min(12, p + 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs transition-colors hover:border-gray-500"
            >
              +
            </button>
          </span>
          {pricePerServing && (
            <span className="font-medium text-foreground">
              {pricePerServing}{" "}
              <span className="font-normal text-gray-400">{t.recipePricePerServing}</span>
            </span>
          )}
        </div>

        {/* Add to cart */}
        {mainIngredients.length > 0 && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addState !== "idle"}
            className={`mb-8 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              addState === "done"
                ? "bg-green-500 focus:ring-green-500"
                : "bg-picnic-red hover:bg-red-700 focus:ring-picnic-red disabled:opacity-60"
            }`}
          >
            {buttonLabel}
          </button>
        )}

        {/* Main ingredients */}
        {mainIngredients.length > 0 && (
          <section className="mb-6">
            <h2 className="text-foreground mb-2 text-base font-semibold">{t.recipeIngredients}</h2>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-4">
              {mainIngredients.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  qty={Math.max(1, Math.ceil((ing.quantity * portions) / recipe.portions))}
                  portions={portions}
                  basePortion={recipe.portions}
                />
              ))}
            </div>
          </section>
        )}

        {/* Condiments */}
        {condiments.length > 0 && (
          <section className="mb-6">
            <h2 className="text-text-muted mb-2 text-sm font-medium">{t.recipeCondiments}</h2>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 px-4">
              {condiments.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  qty={Math.max(1, Math.ceil((ing.quantity * portions) / recipe.portions))}
                  portions={portions}
                  basePortion={recipe.portions}
                />
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <section className="mb-6">
            <h2 className="text-foreground mb-3 text-base font-semibold">{t.recipeSteps}</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-picnic-red mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-text-dark text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Nutrition */}
        {recipe.recipeNutritionRows.length > 0 && (
          <section className="mb-6">
            <h2 className="text-foreground mb-2 text-base font-semibold">{t.recipeNutrition}</h2>
            <p className="text-text-muted mb-2 text-xs">{t.recipePricePerServing}</p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <RecipeNutritionTable rows={recipe.recipeNutritionRows} />
            </div>
          </section>
        )}

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
