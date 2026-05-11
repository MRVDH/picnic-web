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
import { buildImageUrl } from "@/lib/image-url";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse, RecipeDetail, RecipeIngredient } from "@/lib/types";

const PLACEHOLDER = "/placeholder-product.svg";

// ─── State ───────────────────────────────────────────────────────────────────

type PageState =
  | { status: "loading" }
  | { status: "success"; recipe: RecipeDetail }
  | { status: "error"; message: string };

type AddState = "idle" | "adding" | "done";

// ─── Ingredient row ───────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  qty,
}: {
  ingredient: RecipeIngredient;
  qty: number;
}) {
  const countryCode = useCountryCode();
  const [imgSrc, setImgSrc] = useState(
    ingredient.imageId ? buildImageUrl(ingredient.imageId, countryCode) : PLACEHOLDER
  );

  const priceDisplay = `€${(ingredient.displayPrice / 100).toFixed(2).replace(".", ",")}`;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imgSrc}
          alt={ingredient.name}
          fill
          unoptimized
          className="object-contain p-1"
          onError={() => {
            if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER);
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-text-dark truncate text-sm font-medium">{ingredient.name}</p>
        <p className="text-text-muted text-xs">{ingredient.unitQuantity}</p>
      </div>
      <div className="shrink-0 text-right">
        {qty > 1 && (
          <p className="text-text-muted text-xs">{qty}×</p>
        )}
        <p className="text-text-dark text-sm font-medium">{priceDisplay}</p>
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

  usePageTitle(
    pageState.status === "success" ? pageState.recipe.name : t.cookbookTitle
  );

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
      if (!res.ok) {
        setAddState("idle");
        return;
      }
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
          <ErrorView
            message={pageState.message}
            onRetry={() => setPageState({ status: "loading" })}
          />
        </main>
      </div>
    );
  }

  const { recipe } = pageState;
  const mainIngredients = recipe.ingredients.filter((i) => !i.isCondiment);
  const condiments = recipe.ingredients.filter((i) => i.isCondiment);

  const buttonLabel =
    addState === "adding"
      ? t.recipeAddingToCart
      : addState === "done"
        ? t.recipeAddedToCart
        : t.recipeAddToCart;

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

        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gray-50">
          {recipe.imageId ? (
            <div className="relative aspect-video w-full">
              <Image
                src={buildImageUrl(recipe.imageId, countryCode)}
                alt={recipe.name}
                fill
                unoptimized
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-gray-100" />
          )}
        </div>

        {/* Title + meta */}
        <h1 className="text-foreground mb-3 text-2xl font-bold">{recipe.name}</h1>
        <div className="text-text-muted mb-6 flex items-center gap-4 text-sm">
          {recipe.cookingTimeMinutes !== null && (
            <span>⏱ {recipe.cookingTimeMinutes} {t.cookingTimeMinutes}</span>
          )}
          <span>
            {t.recipePortions}:{" "}
            <button
              type="button"
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs transition-colors hover:border-gray-500"
            >
              −
            </button>
            <span className="mx-2 font-medium text-foreground">{portions}</span>
            <button
              type="button"
              onClick={() => setPortions((p) => Math.min(12, p + 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs transition-colors hover:border-gray-500"
            >
              +
            </button>
          </span>
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

        {/* Ingredients */}
        {mainIngredients.length > 0 && (
          <section className="mb-6">
            <h2 className="text-foreground mb-2 text-base font-semibold">
              {t.recipeIngredients}
            </h2>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-4">
              {mainIngredients.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  qty={Math.max(1, Math.ceil(ing.quantity * portions / recipe.portions))}
                />
              ))}
            </div>
          </section>
        )}

        {/* Condiments */}
        {condiments.length > 0 && (
          <section className="mb-6">
            <h2 className="text-text-muted mb-2 text-sm font-medium">
              {t.recipeCondiments}
            </h2>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 px-4">
              {condiments.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  qty={Math.max(1, Math.ceil(ing.quantity * portions / recipe.portions))}
                />
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <section className="mb-6">
            <h2 className="text-foreground mb-3 text-base font-semibold">
              {t.recipeSteps}
            </h2>
            <ol className="space-y-3">
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
      </main>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <CartProvider>
      <RecipeDetailInner recipeId={id} />
    </CartProvider>
  );
}
