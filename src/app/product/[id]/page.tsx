"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProductDetail, ApiErrorResponse } from "@/lib/types";
import { ProductGallery } from "@/components/product-gallery";
import { ProductInfoHeader } from "@/components/product-info-header";
import { ProductPriceSection } from "@/components/product-price-section";
import { ProductDescription } from "@/components/product-description";
import { ProductHighlights } from "@/components/product-highlights";
import { AllergenBadges } from "@/components/allergen-badges";
import { AccordionSection } from "@/components/accordion-section";
import { ProductSlider } from "@/components/product-slider";
import { ProductLabels } from "@/components/product-labels";
import { NutritionTable } from "@/components/nutrition-table";

// ─── State ───────────────────────────────────────────────────────────────────

type ProductPageState =
  | { status: "loading" }
  | { status: "success"; product: ProductDetail }
  | { status: "not_found" }
  | { status: "error"; message: string };

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchProductDetail(
  productId: string,
): Promise<ProductPageState> {
  try {
    const response = await fetch(
      `/api/product/${encodeURIComponent(productId)}`,
    );
    const data: ProductDetail | ApiErrorResponse = await response.json();

    if ("error" in data) {
      if ("code" in data && data.code === "TOKEN_EXPIRED") {
        // Signal auth redirect — handled by the caller
        return { status: "error", message: "TOKEN_EXPIRED" };
      }
      if (response.status === 404) {
        return { status: "not_found" };
      }
      return { status: "error", message: data.error };
    }

    return { status: "success", product: data };
  } catch {
    return {
      status: "error",
      message: "Er is iets misgegaan. Probeer het later opnieuw.",
    };
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

const TOKEN_EXPIRED_REDIRECT = "/login?expired=true";
const TOKEN_EXPIRED_MESSAGE = "TOKEN_EXPIRED";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: productId } = use(params);
  const router = useRouter();
  const [pageState, setPageState] = useState<ProductPageState>({
    status: "loading",
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    fetchProductDetail(productId).then((result) => {
      if (isCancelled) return;
      if (result.status === "error" && result.message === TOKEN_EXPIRED_MESSAGE) {
        window.location.href = TOKEN_EXPIRED_REDIRECT;
        return;
      }
      setPageState(result);
    });

    return () => {
      isCancelled = true;
    };
  }, [productId, retryCount]);

  const handleRetry = useCallback(() => {
    setPageState({ status: "loading" });
    setRetryCount((count) => count + 1);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-card-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-picnic-red"
          >
            Picnic Web
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 transition-colors hover:text-foreground"
          >
            &larr; Terug
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {pageState.status === "loading" && <LoadingView />}
        {pageState.status === "not_found" && <NotFoundView />}
        {pageState.status === "error" && (
          <ErrorView message={pageState.message} onRetry={handleRetry} />
        )}
        {pageState.status === "success" && (
          <ProductDetailView product={pageState.product} />
        )}
      </main>
    </div>
  );
}

// ─── Sub-views ───────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-picnic-red" />
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">:(</div>
      <p className="text-lg text-gray-600">Product niet gevonden</p>
      <Link
        href="/"
        className="mt-4 text-sm text-picnic-red hover:underline"
      >
        Terug naar zoeken
      </Link>
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">:(</div>
      <p className="text-lg text-gray-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md bg-picnic-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        Opnieuw proberen
      </button>
    </div>
  );
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const hasAllergens =
    product.allergens.confirmed.length > 0 ||
    product.allergens.mayContain.length > 0;

  const hasNutritionRows = product.nutritionRows.length > 0;

  return (
    <div className="space-y-8">
      {/* Top section: Gallery + main info side by side */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Gallery */}
        <div className="md:w-1/2">
          <ProductGallery imageIds={product.imageIds} />
        </div>

        {/* Main info next to gallery */}
        <div className="space-y-4 md:w-1/2">
          {/* Labels (Biologisch, 50% korting, etc.) */}
          <ProductLabels labels={product.labels} />

          {/* Title / Brand / Weight / Unit Price / Category Tag */}
          <ProductInfoHeader
            name={product.name}
            brand={product.brand}
            unitQuantity={product.unitQuantity}
            unitPrice={product.unitPrice}
            categoryTag={product.categoryTag}
          />

          {/* Price / Promotion / Bundles */}
          <ProductPriceSection
            displayPrice={product.displayPrice}
            originalPrice={product.originalPrice}
            promotion={product.promotion}
            bundles={product.bundles}
          />

          {/* Description */}
          <ProductDescription description={product.description} />

          {/* Highlights with icons */}
          <ProductHighlights highlights={product.highlights} />
        </div>
      </div>

      {/* Below section: remaining content */}

      {/* Allergen badges */}
      {hasAllergens && <AllergenBadges allergens={product.allergens} />}

      {/* Accordion sections (including Voedingswaarde with structured table) */}
      {product.infoSections.length > 0 && (
        <div className="border-t border-card-border">
          {product.infoSections.map((section) => {
            const isNutrition =
              section.title.toLowerCase().includes("voedingswaarde");

            if (isNutrition && hasNutritionRows) {
              return (
                <AccordionSection key={section.title} title={section.title}>
                  <NutritionTable rows={product.nutritionRows} />
                </AccordionSection>
              );
            }

            return (
              <AccordionSection
                key={section.title}
                title={section.title}
                content={section.content}
              />
            );
          })}
        </div>
      )}

      {/* Similar products slider */}
      <ProductSlider
        title="Vergelijkbare producten"
        products={product.similarProducts}
      />
    </div>
  );
}
