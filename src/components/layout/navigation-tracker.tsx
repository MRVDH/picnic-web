"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { markInAppNavigation } from "@/hooks/use-back-navigation";

/**
 * Notices the first navigation from one app page to another, so back links
 * know they can return to the previous page instead of their fallback.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const firstPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== firstPathname.current) markInAppNavigation();
  }, [pathname]);

  return null;
}
