"use client";

import { useCallback } from "react";

import { useRouter } from "next/navigation";

/** Set once the user navigated inside the app in this tab (survives reloads). */
const IN_APP_NAVIGATION_KEY = "picnic-web:in-app-navigation";

/** Record that the user navigated from one app page to another. */
export function markInAppNavigation(): void {
  try {
    sessionStorage.setItem(IN_APP_NAVIGATION_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); back then uses the fallback.
  }
}

function hasInAppNavigation(): boolean {
  try {
    return sessionStorage.getItem(IN_APP_NAVIGATION_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * A back handler that returns to the previous page, like the app's back
 * arrow. When the page was opened directly (bookmark, new tab, shared link)
 * there's no in-app page to return to, so it goes to `fallbackHref` instead
 * of leaving the site.
 */
export function useBackNavigation(fallbackHref: string): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (hasInAppNavigation() && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);
}
