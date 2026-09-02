"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BasketIcon,
  HeartIcon,
  PotIcon,
  SearchIcon,
  StoreIcon,
} from "@/components/layout/nav-icons";
import { useTranslations } from "@/contexts/country-context";
import { formatPrice } from "@/lib/core/format-price";
import type { Translations } from "@/lib/core/i18n";

// ─── Cart badge state ─────────────────────────────────────────────────────────

export type CartBadgeState =
  | { status: "loading" }
  | { status: "ready"; totalPrice: number; totalCount: number }
  | { status: "error" };

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  key: "discover" | "favorites" | "cooking" | "search" | "cart";
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  /** Route prefixes that count as "inside" this tab, besides href itself. */
  activePrefixes: string[];
};

/** The five tabs of the app, in the app's order. */
function buildNavItems(t: Translations): NavItem[] {
  return [
    {
      key: "discover",
      href: "/discover",
      label: t.navDiscover,
      Icon: StoreIcon,
      activePrefixes: [],
    },
    {
      key: "favorites",
      href: "/favorites",
      label: t.navFavorites,
      Icon: HeartIcon,
      activePrefixes: [],
    },
    {
      key: "cooking",
      href: "/cookbook",
      label: t.navCooking,
      Icon: PotIcon,
      activePrefixes: ["/recipe"],
    },
    {
      key: "search",
      href: "/search",
      label: t.navSearch,
      Icon: SearchIcon,
      activePrefixes: ["/categories", "/product", "/pages"],
    },
    {
      key: "cart",
      href: "/cart",
      label: t.navCart,
      Icon: BasketIcon,
      activePrefixes: ["/checkout"],
    },
  ];
}

function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return item.activePrefixes.some((prefix) => pathname.startsWith(prefix));
}

// ─── Cart price badge ─────────────────────────────────────────────────────────

function CartPriceBadge({ state, className }: { state: CartBadgeState; className: string }) {
  if (state.status !== "ready" || state.totalCount === 0) return null;
  return (
    <span
      className={`bg-picnic-red rounded-full px-1.5 py-0.5 text-[11px] leading-none font-bold text-white ${className}`}
    >
      {formatPrice(state.totalPrice)}
    </span>
  );
}

// ─── Desktop nav (in the header) ─────────────────────────────────────────────

type NavProps = {
  cartState: CartBadgeState;
};

export function DesktopNav({ cartState }: NavProps) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav aria-label={t.navMainAriaLabel} className="hidden items-center gap-1 md:flex">
      {buildNavItems(t).map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "text-picnic-red bg-picnic-red/10"
                : "hover:text-foreground text-gray-600 hover:bg-gray-100"
            }`}
          >
            <item.Icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.key === "cart" && <CartPriceBadge state={cartState} className="ml-0.5" />}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Mobile tab bar (fixed to the bottom, like the app) ──────────────────────

export function MobileTabBar({ cartState }: NavProps) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t.navMainAriaLabel}
      className="border-card-border fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {buildNavItems(t).map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium ${
                  active ? "text-picnic-red" : "text-gray-600"
                }`}
              >
                <span className="relative">
                  <item.Icon className="h-6 w-6" />
                  {item.key === "cart" && (
                    <CartPriceBadge state={cartState} className="absolute -top-2 -right-5" />
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
