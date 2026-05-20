"use client";

import { useCallback, useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { CartToast } from "@/components/cart-toast";
import { SharedHeader } from "@/components/shared-header";
import { SubcategoryView } from "@/components/subcategory-view";
import type { SubcategoriesState } from "@/components/subcategory-view";
import { CartProvider } from "@/contexts/cart-context";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CategoryItem, SubcategoriesApiResponse } from "@/lib/category-types";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse } from "@/lib/types";

export default function CategorySubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const router = useRouter();

  const [state, setState] = useState<SubcategoriesState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const categoryName = state.status === "success" ? state.title : undefined;
  usePageTitle(categoryName);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/categories/${encodeURIComponent(categoryId)}/subcategories`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: SubcategoriesApiResponse & Partial<ApiErrorResponse>) => {
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
          title: data.title ?? "Categorie",
          subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          status: "error",
          message: "Kan subcategorieën niet laden.",
        });
      });

    return () => controller.abort();
  }, [categoryId, retryCount]);

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleSubcategoryTap = useCallback(
    (subcategory: CategoryItem) => {
      router.push(
        `/categories/${encodeURIComponent(categoryId)}/${encodeURIComponent(subcategory.id)}`
      );
    },
    [categoryId, router]
  );

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  const displayName = state.status === "success" ? state.title : "Categorie";

  return (
    <CartProvider showToast={setToastMessage}>
      <div className="flex min-h-full flex-1 flex-col">
        <SharedHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <SubcategoryView
            categoryName={displayName}
            state={state}
            onBack={handleBack}
            onRetry={handleRetry}
            onSubcategoryTap={handleSubcategoryTap}
          />
        </main>
        <CartToast message={toastMessage} onDismiss={dismissToast} />
      </div>
    </CartProvider>
  );
}
