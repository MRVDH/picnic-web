"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartData, ApiErrorResponse } from "@/lib/types";
import { CartItemCard } from "@/components/cart-item";
import { OrderSummary } from "@/components/order-summary";
import { MinimumOrderIndicator } from "@/components/minimum-order-indicator";
import { ProductSlider } from "@/components/product-slider";
import { CheckoutCta } from "@/components/checkout-cta";
import { SharedHeader } from "@/components/shared-header";

// ─── State ───────────────────────────────────────────────────────────────────

type CartPageState =
  | { status: "loading" }
  | { status: "success"; cart: CartData }
  | { status: "empty" }
  | { status: "error"; message: string };

// ─── Data fetching ───────────────────────────────────────────────────────────

const TOKEN_EXPIRED_REDIRECT = "/login?expired=true";
const TOKEN_EXPIRED_MESSAGE = "TOKEN_EXPIRED";

async function fetchCart(): Promise<CartPageState> {
  try {
    const response = await fetch("/api/cart");
    const data: CartData | ApiErrorResponse = await response.json();

    if ("error" in data) {
      if ("code" in data && data.code === "TOKEN_EXPIRED") {
        return { status: "error", message: TOKEN_EXPIRED_MESSAGE };
      }
      return {
        status: "error",
        message: data.error,
      };
    }

    if (data.totalCount === 0) {
      return { status: "empty" };
    }

    return { status: "success", cart: data };
  } catch {
    return {
      status: "error",
      message: "Er is iets misgegaan. Probeer het later opnieuw.",
    };
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<CartPageState>({
    status: "loading",
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    fetchCart().then((result) => {
      if (isCancelled) return;
      if (
        result.status === "error" &&
        result.message === TOKEN_EXPIRED_MESSAGE
      ) {
        window.location.href = TOKEN_EXPIRED_REDIRECT;
        return;
      }
      setPageState(result);
    });

    return () => {
      isCancelled = true;
    };
  }, [retryCount]);

  const handleRetry = useCallback(() => {
    setPageState({ status: "loading" });
    setRetryCount((c) => c + 1);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 transition-colors hover:text-foreground"
        >
          &larr; Terug
        </button>
      </SharedHeader>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {pageState.status === "loading" && <LoadingView />}
        {pageState.status === "error" && (
          <ErrorView message={pageState.message} onRetry={handleRetry} />
        )}
        {pageState.status === "empty" && <EmptyView />}
        {pageState.status === "success" && (
          <CartPageContent cart={pageState.cart} />
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

function EmptyView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">🛒</div>
      <p className="text-lg font-semibold text-foreground">
        Je winkelwagen is leeg
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Voeg producten toe via de Picnic app of zoek iets op.
      </p>
      <Link
        href="/"
        className="mt-4 text-sm text-picnic-red hover:underline"
      >
        Naar zoeken
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

// ─── Cart content ─────────────────────────────────────────────────────────────

function CartPageContent({ cart }: { cart: CartData }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Winkelwagen</h1>

      {/* Cart items list */}
      <div>
        {cart.items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Minimum order value indicator (US3) */}
      <MinimumOrderIndicator
        currentTotal={cart.totalPrice}
        minimumOrderValue={cart.minimumOrderValue}
      />

      {/* Order summary (US2) */}
      <OrderSummary
        totalPrice={cart.totalPrice}
        totalCount={cart.totalCount}
        totalDiscount={cart.totalDiscount}
        depositTotal={cart.depositTotal}
        depositBreakdown={cart.depositBreakdown}
        membershipSavings={cart.membershipSavings}
      />

      {/* Suggestions: "Niets vergeten?" (US5) */}
      <ProductSlider title="Niets vergeten?" products={cart.suggestions} />

      {/* Checkout CTA (US6) */}
      <CheckoutCta />
    </div>
  );
}
