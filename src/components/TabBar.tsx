"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabInfo = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const TAB_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  purchases: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  recipes: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 .91-.26 1.76-.7 2.5H17a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.1a5 5 0 0 1-9.8 0H7a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.7A4.97 4.97 0 0 1 7 7a5 5 0 0 1 5-5z" />
      <path d="M10 17v5" />
      <path d="M14 17v5" />
    </svg>
  ),
  search: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  cart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
};

export function TabBar({ tabs }: { tabs: TabInfo[] }) {
  const pathname = usePathname();

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-bar__brand">Picnic</Link>
      <div className="nav-bar__items">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`nav-bar__item ${isActive ? "nav-bar__item--active" : ""}`}
            >
              <span className="nav-bar__icon">
                {TAB_ICONS[tab.icon] || TAB_ICONS.home}
              </span>
              <span className="nav-bar__label">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
