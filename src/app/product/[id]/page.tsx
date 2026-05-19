"use client";

import { use, useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { AccordionSection } from "@/components/accordion-section";
import { AllergenBadges } from "@/components/allergen-badges";
import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { NutritionTable } from "@/components/nutrition-table";
import { ProductDescription } from "@/components/product-description";
import { ProductGallery } from "@/components/product-gallery";
import { ProductHighlights } from "@/components/product-highlights";
import { ProductInfoHeader } from "@/components/product-info-header";
import { ProductLabels } from "@/components/product-labels";
import { ProductPriceSection } from "@/components/product-price-section";
import { ProductSlider } from "@/components/product-slider";
import { SharedHeader } from "@/components/shared-header";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_MESSAGE, TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse, ProductDetail } from "@/lib/types";

// ─── State ───────────────────────────────────────────────────────────────────

type ProductPageState =
  | { status: "loading" }
  | { status: "success"; product: ProductDetail }
  | { status: "not_found" }
  | { status: "error"; message: string };

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchProductDetail(productId: string): Promise<ProductPageState> {
  try {
    const response = await fetch(`/api/product/${encodeURIComponent(productId)}`);
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

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const [pageState, setPageState] = useState<ProductPageState>({
    status: "loading",
  });
  const [retryCount, setRetryCount] = useState(0);

  const pageContext = pageState.status === "success" ? pageState.product.name : undefined;
  usePageTitle(pageContext);

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
    <CartProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader />

        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
          {pageState.status === "loading" && <LoadingSpinner />}
          {pageState.status === "not_found" && <NotFoundView />}
          {pageState.status === "error" && (
            <ErrorView message={pageState.message} onRetry={handleRetry} />
          )}
          {pageState.status === "success" && <ProductDetailView product={pageState.product} />}
        </main>
      </div>
    </CartProvider>
  );
}

// ─── Sub-views ───────────────────────────────────────────────────────────────

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">:(</div>
      <p className="text-lg text-gray-600">Product niet gevonden</p>
      <Link href="/" className="text-picnic-red mt-4 text-sm hover:underline">
        Terug naar zoeken
      </Link>
    </div>
  );
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const { getQuantity, addProduct, removeProduct } = useCart();
  const cartQuantity = getQuantity(product.id);

  const handleSetQuantity = useCallback(
    (target: number) => {
      const current = getQuantity(product.id);
      const diff = target - current;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) addProduct(product.id, product.maxCount);
      } else if (diff < 0) {
        for (let i = 0; i < -diff; i++) removeProduct(product.id);
      }
    },
    [product.id, product.maxCount, getQuantity, addProduct, removeProduct]
  );

  const hasAllergens =
    product.allergens.confirmed.length > 0 || product.allergens.mayContain.length > 0;

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
            cartQuantity={cartQuantity}
            maxCount={product.maxCount}
            onIncrement={() => addProduct(product.id, product.maxCount)}
            onDecrement={() => removeProduct(product.id)}
            onSetQuantity={handleSetQuantity}
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
        <div className="border-card-border border-t">
          {product.infoSections.map((section) => {
            const isNutrition = section.title.toLowerCase().includes("voedingswaarde");

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
      <ProductSlider title="Vergelijkbare producten" products={product.similarProducts} />
    </div>
  );
}
