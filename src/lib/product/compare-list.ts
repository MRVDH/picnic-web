// The products picked for the side-by-side comparison: product ids kept in
// localStorage, so the list survives navigation and reloads in this browser.

/** The comparison shows at most this many products next to each other. */
export const MAX_COMPARE_PRODUCTS = 4;

const STORAGE_KEY = "picnic-web:compare";
const EMPTY: readonly string[] = [];

const listeners = new Set<() => void>();
/** The list when localStorage is blocked: kept for this page load. */
let memoryIds: readonly string[] = EMPTY;
/** The last list read, so useSyncExternalStore gets the same array while nothing changed. */
let cached: { raw: string | null; ids: readonly string[] } = { raw: null, ids: EMPTY };

/** The product ids to compare, in the order they were added. */
export function readCompareIds(): readonly string[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryIds;
  }
  if (raw === cached.raw) return cached.ids;
  cached = { raw, ids: parseIds(raw) };
  return cached.ids;
}

/** The server render has no list; the client fills it in after hydration. */
export function readServerCompareIds(): readonly string[] {
  return EMPTY;
}

export function subscribeToCompareIds(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Adds a product to the comparison, or removes it when it is already there.
 * Returns false when the list is full and the product wasn't added.
 */
export function toggleCompareId(productId: string): boolean {
  const ids = readCompareIds();
  if (ids.includes(productId)) {
    writeIds(ids.filter((id) => id !== productId));
    return true;
  }
  if (ids.length >= MAX_COMPARE_PRODUCTS) return false;
  writeIds([...ids, productId]);
  return true;
}

export function removeCompareId(productId: string) {
  writeIds(readCompareIds().filter((id) => id !== productId));
}

export function clearCompareIds() {
  writeIds([]);
}

function writeIds(ids: readonly string[]) {
  memoryIds = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage can be blocked; the list then lasts until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

function parseIds(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    return value
      .filter((id): id is string => typeof id === "string")
      .slice(0, MAX_COMPARE_PRODUCTS);
  } catch {
    return EMPTY;
  }
}
