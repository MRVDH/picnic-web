"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CartData, ApiErrorResponse } from "@/lib/types";
import { useCartOptional } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/format-price";
import { SearchBar } from "@/components/search-bar";

// ─── Cart badge state ─────────────────────────────────────────────────────────

type CartBadgeState =
  | { status: "loading" }
  | { status: "ready"; totalPrice: number; totalCount: number }
  | { status: "error" };

// ─── Cart icon ────────────────────────────────────────────────────────────────

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

// ─── Cart badge ───────────────────────────────────────────────────────────────

function CartBadge({ state }: { state: CartBadgeState }) {
  const showBadge =
    state.status === "ready" && state.totalCount > 0;

  return (
    <Link
      href="/cart"
      className="relative flex items-center text-gray-600 transition-colors hover:text-foreground"
      aria-label="Winkelwagen"
    >
      <CartIcon />
      {showBadge && (
        <span className="ml-1 rounded-full bg-picnic-red px-2 py-0.5 text-xs font-semibold text-white">
          {formatPrice(state.totalPrice)}
        </span>
      )}
    </Link>
  );
}

// ─── Shared header ────────────────────────────────────────────────────────────

type SharedHeaderProps = {
  bottomBar?: React.ReactNode;
  cartBadgeOverride?: {
    totalPrice: number;
    totalCount: number;
  } | null;
};

/**
 * Sticky header shared across all authenticated pages.
 * Always renders the search bar and logout button.
 * Fetches /api/cart on mount and shows a price badge on the cart icon.
 * Badge is hidden while loading, on error, or when the cart is empty.
 */
export function SharedHeader({
  bottomBar,
  cartBadgeOverride = null,
}: SharedHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const cartContext = useCartOptional();
  const [fetchedState, setFetchedState] = useState<CartBadgeState>({
    status: "loading",
  });

  // Only fetch independently when NOT inside a CartProvider.
  const shouldFetchIndependently = !cartContext;

  useEffect(() => {
    if (!shouldFetchIndependently) return;

    let isCancelled = false;

    fetch("/api/cart")
      .then((res) => res.json())
      .then((data: CartData | ApiErrorResponse) => {
        if (isCancelled) return;
        if ("error" in data) {
          setFetchedState({ status: "error" });
          return;
        }
        setFetchedState({
          status: "ready",
          totalPrice: data.totalPrice,
          totalCount: data.totalCount,
        });
      })
      .catch(() => {
        if (!isCancelled) setFetchedState({ status: "error" });
      });

    return () => {
      isCancelled = true;
    };
  }, [shouldFetchIndependently]);

  // Derive badge state: prefer context (reactive), fall back to own fetch.
  const cartState: CartBadgeState = cartBadgeOverride
    ? {
        status: "ready",
        totalPrice: cartBadgeOverride.totalPrice,
        totalCount: cartBadgeOverride.totalCount,
      }
    : cartContext
      ? cartContext.isLoading
        ? { status: "loading" }
        : {
            status: "ready",
            totalPrice: cartContext.totalPrice,
            totalCount: cartContext.totalCount,
          }
      : fetchedState;

  const handleSearch = useCallback(
    (query: string) => {
      router.push(`/?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-card-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-2">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-picnic-red select-none"
          aria-label="Picnic Web"
        >
          Picnic Web
        </Link>

        {/* Search bar + logout */}
        <div className="flex flex-1 items-center gap-4">
          <SearchBar
            key={urlQuery}
            onSearch={handleSearch}
            isLoading={false}
            initialQuery={urlQuery}
          />
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 text-sm text-gray-500 transition-colors hover:text-foreground"
          >
            Uitloggen
          </button>
        </div>

        {/* Cart icon */}
        <CartBadge state={cartState} />
      </div>
      {bottomBar}
    </header>
  );
}
