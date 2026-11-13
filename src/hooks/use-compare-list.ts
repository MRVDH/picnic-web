import { useSyncExternalStore } from "react";

import {
  readCompareIds,
  readServerCompareIds,
  subscribeToCompareIds,
} from "@/lib/product/compare-list";

/** The product ids picked for the comparison; re-renders when the list changes. */
export function useCompareList(): readonly string[] {
  return useSyncExternalStore(subscribeToCompareIds, readCompareIds, readServerCompareIds);
}
