"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { CartToast } from "@/components/cart-toast";
import { CategoryProductsView } from "@/components/category-products-view";
import type { CategoryProductsState } from "@/components/category-products-view";
import { SectionNavBar } from "@/components/section-nav-bar";
import { SharedHeader } from "@/components/shared-header";
import { CartProvider } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse, CategoryProductsApiResponse } from "@/lib/types";

export default function ShortcutProductsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  const pageId = searchParams.get("pageId") ?? "";
  const title = searchParams.get("title") ?? t.defaultPageTitle;

  const initialStatus: CategoryProductsState = pageId
    ? { status: "loading" }
    : { status: "error", message: t.noPageSpecified };

  const [state, setState] = useState<CategoryProductsState>(initialStatus);
  const [retryCount, setRetryCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const pageTitle = state.status === "success" ? state.title : undefined;
  usePageTitle(pageTitle ?? title);

  useEffect(() => {
    if (!pageId) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/pages/products?pageId=${encodeURIComponent(pageId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: CategoryProductsApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setState({ status: "error", message: data.error });
          return;
        }
        setState({
          status: "success",
          title: data.title ?? title,
          products: Array.isArray(data.products) ? data.products : [],
          sections: Array.isArray(data.sections) ? data.sections : [],
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          status: "error",
          message: t.productsLoadError,
        });
      });

    return () => controller.abort();
  }, [pageId, title, retryCount, t.productsLoadError]);

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  const displayName = state.status === "success" ? state.title : title;

  const sections = state.status === "success" ? state.sections : [];

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader
          bottomBar={sections.length > 0 ? <SectionNavBar sections={sections} /> : undefined}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <CategoryProductsView
            categoryName={displayName}
            state={state}
            onBack={handleBack}
            onRetry={handleRetry}
          />
        </main>
        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}
