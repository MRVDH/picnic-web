"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CartPageContent, EmptyView } from "@/components/cart-page-content";
import { CartToast } from "@/components/cart-toast";
import { DeliverySlotPicker } from "@/components/delivery-slot-picker";
import { ErrorView } from "@/components/error-view";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SharedHeader } from "@/components/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_MESSAGE, TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import { createMutationQueue } from "@/lib/mutation-queue";
import type { ApiErrorResponse, CartData } from "@/lib/types";

type CartPageState =
  | { status: "loading" }
  | { status: "success"; cart: CartData }
  | { status: "empty" }
  | { status: "error"; message: string };

async function fetchCart(loadErrorMessage: string): Promise<CartPageState> {
  try {
    const response = await fetch("/api/cart");
    const data: CartData | ApiErrorResponse = await response.json();

    if ("error" in data) {
      if ("code" in data && data.code === "TOKEN_EXPIRED") {
        return { status: "error", message: TOKEN_EXPIRED_MESSAGE };
      }
      return { status: "error", message: data.error };
    }

    if (data.totalCount === 0) {
      return { status: "empty" };
    }

    return { status: "success", cart: data };
  } catch {
    return { status: "error", message: loadErrorMessage };
  }
}

async function postCartMutation(productId: string, action: "add" | "remove"): Promise<CartData> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, action, count: 1 }),
  });

  const data = await response.json();
  if (!response.ok || "error" in data) {
    throw new Error(data.error ?? "Cart mutation failed");
  }

  return data as CartData;
}

export default function CartPage() {
  const t = useTranslations();
  usePageTitle(t.cartTitle);

  const [pageState, setPageState] = useState<CartPageState>({ status: "loading" });
  const cartMutationErrorRef = useRef(t.cartMutationError);
  const [retryCount, setRetryCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const confirmedCartRef = useRef<CartData | null>(null);
  const queueRef = useRef<ReturnType<typeof createMutationQueue<CartData>> | null>(null);

  const reconcileFromServer = useCallback((cart: CartData) => {
    confirmedCartRef.current = cart;
    if (cart.totalCount === 0) {
      setPageState({ status: "empty" });
      return;
    }
    setPageState({ status: "success", cart });
  }, []);

  const rollbackProduct = useCallback((productId: string) => {
    const confirmed = confirmedCartRef.current;
    if (!confirmed) return;

    if (confirmed.totalCount === 0) {
      setPageState({ status: "empty" });
      return;
    }

    setPageState((prev) => {
      if (prev.status !== "success") return prev;
      if (!prev.cart.items.some((item) => item.productId === productId)) {
        return prev;
      }
      return { status: "success", cart: confirmed };
    });
  }, []);

  useEffect(() => {
    queueRef.current = createMutationQueue<CartData>((productId, result, error) => {
      if (error) {
        rollbackProduct(productId);
        setToastMessage(cartMutationErrorRef.current);
        return;
      }

      if (result) {
        reconcileFromServer(result);
      }
    });
  }, [reconcileFromServer, rollbackProduct]);

  useEffect(() => {
    let isCancelled = false;

    fetchCart(t.cartLoadError).then((result) => {
      if (isCancelled) return;

      if (result.status === "error" && result.message === TOKEN_EXPIRED_MESSAGE) {
        window.location.href = TOKEN_EXPIRED_REDIRECT;
        return;
      }

      if (result.status === "success") {
        confirmedCartRef.current = result.cart;
      }

      setPageState(result);
    });

    return () => {
      isCancelled = true;
    };
  }, [retryCount, t.cartLoadError]);

  const handleRetry = useCallback(() => {
    setPageState({ status: "loading" });
    setRetryCount((count) => count + 1);
  }, []);

  const enqueueMutation = useCallback((productId: string, action: "add" | "remove") => {
    queueRef.current?.enqueue(productId, () => postCartMutation(productId, action));
  }, []);

  const handleIncrement = useCallback(
    (productId: string) => {
      // Guard check must happen synchronously before the async state update
      // so that the enqueue decision is not deferred into a React batch.
      const current = pageState;
      if (current.status !== "success") return;
      const item = current.cart.items.find((line) => line.productId === productId);
      if (!item || item.isUnavailable || item.quantity >= item.maxCount) return;

      setPageState((prev) => {
        if (prev.status !== "success") return prev;

        return {
          status: "success",
          cart: {
            ...prev.cart,
            totalCount: prev.cart.totalCount + 1,
            items: prev.cart.items.map((line) =>
              line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line
            ),
          },
        };
      });

      enqueueMutation(productId, "add");
    },
    [enqueueMutation, pageState]
  );

  const handleDecrement = useCallback(
    (productId: string) => {
      // Guard check must happen synchronously before the async state update.
      const current = pageState;
      if (current.status !== "success") return;
      const item = current.cart.items.find((line) => line.productId === productId);
      if (!item || item.isUnavailable || item.quantity <= 0) return;

      setPageState((prev) => {
        if (prev.status !== "success") return prev;

        const prevItem = prev.cart.items.find((line) => line.productId === productId);
        if (!prevItem || prevItem.quantity <= 0) return prev;

        const nextQuantity = prevItem.quantity - 1;
        const nextItems =
          nextQuantity === 0
            ? prev.cart.items.filter((line) => line.productId !== productId)
            : prev.cart.items.map((line) =>
                line.productId === productId ? { ...line, quantity: nextQuantity } : line
              );
        const nextCount = Math.max(0, prev.cart.totalCount - 1);

        if (nextCount === 0 || nextItems.length === 0) {
          return { status: "empty" };
        }

        return {
          status: "success",
          cart: {
            ...prev.cart,
            totalCount: nextCount,
            items: nextItems,
          },
        };
      });

      enqueueMutation(productId, "remove");
    },
    [enqueueMutation, pageState]
  );

  const cartBadgeOverride =
    pageState.status === "success"
      ? {
          totalPrice: pageState.cart.totalPrice,
          totalCount: pageState.cart.totalCount,
        }
      : pageState.status === "empty"
        ? { totalPrice: 0, totalCount: 0 }
        : null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader cartBadgeOverride={cartBadgeOverride} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {pageState.status === "loading" && <LoadingSpinner />}
        {pageState.status === "error" && (
          <ErrorView message={pageState.message} onRetry={handleRetry} />
        )}
        {pageState.status === "empty" && <EmptyView />}
        {pageState.status === "success" && (
          <CartPageContent
            cart={pageState.cart}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onOpenPicker={() => setIsPickerOpen(true)}
          />
        )}
      </main>

      {isPickerOpen && (
        <DeliverySlotPicker
          onClose={() => setIsPickerOpen(false)}
          onSlotSelected={(updatedCart) => {
            reconcileFromServer(updatedCart);
            setIsPickerOpen(false);
          }}
        />
      )}

      <CartToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
