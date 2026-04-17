"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SharedHeader } from "@/components/shared-header";
import { SectionNavBar } from "@/components/section-nav-bar";
import { CartProvider } from "@/contexts/cart-context";
import { CartToast } from "@/components/cart-toast";
import { CategoryProductsView } from "@/components/category-products-view";
import type { CategoryProductsState } from "@/components/category-products-view";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CategoryProductsApiResponse, ApiErrorResponse } from "@/lib/types";

export default function CategoryProductsPage() {
  const { categoryId, subcategoryId } = useParams<{
    categoryId: string;
    subcategoryId: string;
  }>();
  const router = useRouter();

  const [state, setState] = useState<CategoryProductsState>({
    status: "loading",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const pageTitle =
    state.status === "success" ? state.title : undefined;
  usePageTitle(pageTitle);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/categories/${encodeURIComponent(subcategoryId)}/products`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then(
        (data: CategoryProductsApiResponse & Partial<ApiErrorResponse>) => {
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
            title: data.title ?? "Producten",
            products: Array.isArray(data.products) ? data.products : [],
            sections: Array.isArray(data.sections) ? data.sections : [],
          });
        },
      )
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          status: "error",
          message: "Kan producten niet laden.",
        });
      });

    return () => controller.abort();
  }, [subcategoryId, retryCount]);

  const handleBack = useCallback(() => {
    router.push(`/categories/${encodeURIComponent(categoryId)}`);
  }, [categoryId, router]);

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  const displayName =
    state.status === "success" ? state.title : "Producten";

  const sections =
    state.status === "success" ? state.sections : [];

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader
          bottomBar={
            sections.length > 0 ? (
              <SectionNavBar sections={sections} />
            ) : undefined
          }
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
