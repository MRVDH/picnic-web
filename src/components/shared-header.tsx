"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CartData, ApiErrorResponse } from "@/lib/types";
import { CENTS_DIVISOR } from "@/lib/types";

// ─── Cart badge state ─────────────────────────────────────────────────────────

type CartBadgeState =
  | { status: "loading" }
  | { status: "ready"; totalPrice: number; totalCount: number }
  | { status: "error" };

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / CENTS_DIVISOR);
}

// ─── Cart icon ────────────────────────────────────────────────────────────────

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="h-6 w-6"
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
  children?: React.ReactNode;
  bottomBar?: React.ReactNode;
};

/**
 * Sticky header shared across all authenticated pages.
 * Fetches /api/cart on mount and shows a price badge on the cart icon.
 * Badge is hidden while loading, on error, or when the cart is empty.
 * `children` is rendered in the centre slot (e.g. search bar, back button).
 */
export function SharedHeader({ children, bottomBar }: SharedHeaderProps) {
  const [cartState, setCartState] = useState<CartBadgeState>({
    status: "loading",
  });

  useEffect(() => {
    let isCancelled = false;

    fetch("/api/cart")
      .then((res) => res.json())
      .then((data: CartData | ApiErrorResponse) => {
        if (isCancelled) return;
        if ("error" in data) {
          setCartState({ status: "error" });
          return;
        }
        setCartState({
          status: "ready",
          totalPrice: data.totalPrice,
          totalCount: data.totalCount,
        });
      })
      .catch(() => {
        if (!isCancelled) setCartState({ status: "error" });
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-card-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-2xl font-bold tracking-tight text-picnic-red select-none"
          aria-label="Picnic Web"
        >
          Picnic Web
        </Link>

        {/* Centre slot */}
        {children && (
          <div className="flex flex-1 items-center gap-4">{children}</div>
        )}

        {/* Spacer when no children */}
        {!children && <div className="flex-1" />}

        {/* Cart icon */}
        <CartBadge state={cartState} />
      </div>
      {bottomBar}
    </header>
  );
}
