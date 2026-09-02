"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { AccountPanel } from "@/components/layout/account-panel";
import { type CartBadgeState, DesktopNav, MobileTabBar } from "@/components/layout/app-nav";
import { UserIcon } from "@/components/layout/nav-icons";
import { useCartOptional } from "@/contexts/cart-context";
import { useTranslations } from "@/contexts/country-context";
import type { ApiErrorResponse, CartData } from "@/lib/core/types";

type SharedHeaderProps = {
  bottomBar?: React.ReactNode;
  cartBadgeOverride?: {
    totalPrice: number;
    totalCount: number;
  } | null;
};

/**
 * Sticky header shared across all authenticated pages, plus the mobile tab bar.
 *
 * Desktop: logo, the five app tabs inline, and the account button.
 * Mobile (< md): logo and account button on top, the five tabs fixed at the
 * bottom like the app. Fetches /api/cart on mount (unless inside a
 * CartProvider) to show the cart price badge; the badge is hidden while
 * loading, on error, or when the cart is empty.
 */
export function SharedHeader({ bottomBar, cartBadgeOverride = null }: SharedHeaderProps) {
  const t = useTranslations();
  const cartContext = useCartOptional();
  const [accountOpen, setAccountOpen] = useState(false);
  const [fetchedState, setFetchedState] = useState<CartBadgeState>({ status: "loading" });

  // Only fetch independently when NOT inside a CartProvider.
  const shouldFetchIndependently = !cartContext;

  useEffect(() => {
    if (!shouldFetchIndependently) return;

    const controller = new AbortController();

    fetch("/api/cart", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: CartData | ApiErrorResponse) => {
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
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetchedState({ status: "error" });
      });

    return () => {
      controller.abort();
    };
  }, [shouldFetchIndependently]);

  // Derive badge state: prefer the override, then context (reactive), then our own fetch.
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

  return (
    <>
      <header className="border-card-border sticky top-0 z-20 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2">
          <Link
            href="/"
            className="text-picnic-red shrink-0 text-xl font-bold tracking-tight select-none"
            aria-label="Picnic Web"
          >
            Picnic Web
          </Link>

          <DesktopNav cartState={cartState} />

          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label={t.navAccount}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            className="hover:text-foreground shrink-0 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <UserIcon className="h-6 w-6" />
          </button>
        </div>
        {bottomBar}
      </header>

      <MobileTabBar cartState={cartState} />
      <AccountPanel open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
