"use client";

import { useCallback, useMemo, useState } from "react";

import { CartToast } from "@/components/cart/cart-toast";
import { ProductGrid } from "@/components/product/product-grid";
import { PromotionGroupCard } from "@/components/product/promotion-group-card";
import { BackLink } from "@/components/ui/back-link";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { usePublishHeaderSections } from "@/contexts/header-sections-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { PromotionsApiResponse, PromotionsSection, SearchSection } from "@/lib/core/types";
import { buildSectionId } from "@/lib/core/types";

/**
 * The promotions page (the app's promo-page-root): per section, cards for
 * promotions on several products and the products on promotion.
 */
export default function PromotionsPage() {
  const t = useTranslations();
  usePageTitle(t.promotionsTitle);
  const { state, retry } = useApiResource<PromotionsApiResponse>(
    "/api/promotions",
    t.promotionsLoadError
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const sections = state.status === "success" ? state.data.sections : null;
  const headerSections = useMemo<SearchSection[]>(
    () => (sections ?? []).map(({ title, products }) => ({ title, products })),
    [sections]
  );
  usePublishHeaderSections(headerSections);

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <BackLink fallbackHref="/search">{t.backButton}</BackLink>
          <h1 className="text-foreground mb-6 text-2xl font-bold">{t.promotionsTitle}</h1>
          {state.status === "loading" && <LoadingSpinner />}
          {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
          {sections && sections.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">{t.promotionsEmpty}</p>
          )}
          {sections && sections.length > 0 && (
            <div className="space-y-8">
              {sections.map((section, index) => (
                <PromotionsSectionView key={index} section={section} index={index} />
              ))}
            </div>
          )}
        </main>
        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}

function PromotionsSectionView({ section, index }: { section: PromotionsSection; index: number }) {
  return (
    <section id={buildSectionId(index)} className="scroll-mt-36">
      {section.title && (
        <h2 className="text-foreground mb-3 text-lg font-semibold">{section.title}</h2>
      )}
      {section.groups.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {section.groups.map((group) => (
            <PromotionGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
      <ProductGrid products={section.products} />
    </section>
  );
}
