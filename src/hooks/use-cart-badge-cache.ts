"use client";

import { useSyncExternalStore } from "react";

/**
 * Last known cart total, kept in localStorage so the header badge can render on
 * first paint instead of popping in once /api/cart answers (which made the nav
 * jump on every page load). The live cart overwrites it as soon as it arrives.
 */
export type CachedCartBadge = { totalPrice: number; totalCount: number };

const STORAGE_KEY = "picnic_cart_badge";

const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let lastValue: CachedCartBadge | null = null;

function emit() {
  for (const listener of listeners) listener();
}

/** Read the cached badge; returns a stable object while the stored value is unchanged. */
export function readCartBadgeCache(): CachedCartBadge | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === lastRaw) return lastValue;
  lastRaw = raw;
  lastValue = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof (parsed as CachedCartBadge).totalPrice === "number" &&
        typeof (parsed as CachedCartBadge).totalCount === "number"
      ) {
        lastValue = parsed as CachedCartBadge;
      }
    } catch {
      lastValue = null;
    }
  }
  return lastValue;
}

export function writeCartBadgeCache(value: CachedCartBadge): void {
  const raw = JSON.stringify(value);
  if (raw === lastRaw) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable (private mode, quota): the badge simply loads late.
  }
  emit();
}

/** Call on sign-out so the next user does not see the previous cart total. */
export function clearCartBadgeCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): CachedCartBadge | null {
  return null;
}

export function useCartBadgeCache(): CachedCartBadge | null {
  return useSyncExternalStore(subscribe, readCartBadgeCache, getServerSnapshot);
}
