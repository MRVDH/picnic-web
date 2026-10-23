"use client";

import { useCallback, useState } from "react";

import { useParams } from "next/navigation";

import { CartToast } from "@/components/cart/cart-toast";
import { ProductGrid } from "@/components/product/product-grid";
import { BackLink } from "@/components/ui/back-link";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { PromotionGroupApiResponse } from "@/lib/core/types";

/** The products of one promotion group (the app's promo-group-deep-dive). */
export default function PromotionGroupPage() {
  const t = useTranslations();
  const { groupId } = useParams<{ groupId: string }>();
  const { state, retry } = useApiResource<PromotionGroupApiResponse>(
    `/api/promotions/${encodeURIComponent(groupId)}`,
    t.productsLoadError
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const title = (state.status === "success" && state.data.name) || t.promotionsTitle;
  usePageTitle(title);

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <BackLink fallbackHref="/promotions">{t.backButton}</BackLink>
          <h1 className="text-foreground mb-6 text-2xl font-bold">{title}</h1>
          {state.status === "loading" && <LoadingSpinner />}
          {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
          {state.status === "success" && state.data.products.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">{t.noProductsInCategory}</p>
          )}
          {state.status === "success" && state.data.products.length > 0 && (
            <div>
              <p className="mb-4 text-sm text-gray-500">
                {state.data.products.length}{" "}
                {state.data.products.length === 1 ? t.productSingular : t.productPlural}
              </p>
              <ProductGrid products={state.data.products} />
            </div>
          )}
        </main>
        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}
