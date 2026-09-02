"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountPanel } from "@/components/layout/account-panel";
import { type CartBadgeState, DesktopNav, MobileTabBar } from "@/components/layout/app-nav";
import { UserIcon } from "@/components/layout/nav-icons";
import { SectionNavBar } from "@/components/layout/section-nav-bar";
import { useTranslations } from "@/contexts/country-context";
import { useHeaderSections } from "@/contexts/header-sections-context";
import { useCartBadgeCache, writeCartBadgeCache } from "@/hooks/use-cart-badge-cache";
import type { ApiErrorResponse, CartData } from "@/lib/core/types";

/**
 * Header and mobile tab bar for all authenticated pages. Rendered once by the
 * (app) layout, so it stays mounted across client-side navigation.
 *
 * Desktop: logo, the five app tabs inline, and the account button. Mobile
 * (< md): logo and account button on top, the five tabs fixed at the bottom.
 *
 * The cart badge reads the shared badge store (last known total, persisted in
 * localStorage): CartProvider and the cart page write to it whenever their
 * totals change, and this header refreshes it from /api/cart on every route
 * change so pages without a cart context (checkout, deliveries) stay current.
 * The badge is hidden until a total is known or when the cart is empty.
 */
export function SharedHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const sections = useHeaderSections();
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/cart", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: CartData | ApiErrorResponse) => {
        if ("error" in data) return;
        writeCartBadgeCache({ totalPrice: data.totalPrice, totalCount: data.totalCount });
      })
      .catch(() => {
        // Aborted or failed: the badge keeps showing the last known total.
      });

    return () => controller.abort();
  }, [pathname]);

  const cachedBadge = useCartBadgeCache();
  const cartState: CartBadgeState = cachedBadge
    ? { status: "ready", ...cachedBadge }
    : { status: "loading" };

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
        {sections.length > 0 && <SectionNavBar sections={sections} />}
      </header>

      <MobileTabBar cartState={cartState} />
      <AccountPanel open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
