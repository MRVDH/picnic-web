"use client";

import React, { useEffect, useState } from "react";
import { TabBar, TabInfo } from "./TabBar";

function mapBootstrapToTabs(bootstrap: any): TabInfo[] {
  if (!bootstrap?.tabs) return getDefaultTabs();

  return bootstrap.tabs.map((tab: any) => {
    const id = tab.id;
    const label = tab.accessibility?.label || tab.title || id;

    // Map tab types to icons and routes
    let icon = "home";
    let href = "/";

    if (tab.tab_type === "PAGE" && tab.target?.type === "PICNIC_PAGE_REFERENCE") {
      const ref = tab.target.reference;
      if (ref === "home_page_root") {
        icon = "home";
        href = "/";
      } else if (ref === "purchases-page-root") {
        icon = "purchases";
        href = "/purchases";
      } else if (ref === "meals-page-root") {
        icon = "recipes";
        href = "/recipes";
      } else {
        icon = "home";
        href = `/page/${ref}`;
      }
    } else if (tab.tab_type === "LEGACY_SEARCH" || tab.tab_type === "SEARCH") {
      icon = "search";
      href = "/search";
    } else if (tab.tab_type === "CART") {
      icon = "cart";
      href = "/cart";
    }

    return { id, label, icon, href };
  });
}

function getDefaultTabs(): TabInfo[] {
  return [
    { id: "home", label: "Home", icon: "home", href: "/" },
    { id: "purchases", label: "Besteld", icon: "purchases", href: "/purchases" },
    { id: "recipes", label: "Recepten", icon: "recipes", href: "/recipes" },
    { id: "search", label: "Zoeken", icon: "search", href: "/search" },
    { id: "cart", label: "Mandje", icon: "cart", href: "/cart" },
  ];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<TabInfo[]>(getDefaultTabs());

  useEffect(() => {
    fetch("/api/bootstrap")
      .then((res) => res.json())
      .then((data) => {
        setTabs(mapBootstrapToTabs(data));
      })
      .catch(() => {
        // Keep default tabs
      });
  }, []);

  return (
    <div className="app-shell">
      <TabBar tabs={tabs} />
      <main className="app-main">{children}</main>
    </div>
  );
}
