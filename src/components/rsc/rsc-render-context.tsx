"use client";

import { createContext, useContext } from "react";

import type { RscAction } from "@/lib/rsc/rsc-page-types";

export type RscRenderContextValue = {
  /** Design tokens and palette colors from the page theme, e.g. "YELLOW2" → "#FBD92B". */
  tokens: Record<string, string>;
  /**
   * Run the actions of an interaction slot (navigation, cart changes).
   * `title` is used as page title when the actions open a page.
   */
  dispatch: (actions: RscAction[], title: string) => void;
};

export const RscRenderContext = createContext<RscRenderContextValue>({
  tokens: {},
  dispatch: () => {},
});

export function useRscRenderContext(): RscRenderContextValue {
  return useContext(RscRenderContext);
}

/** Resolve a color token through the theme; literal CSS colors pass through. */
export function resolveColor(tokens: Record<string, string>, value: unknown): string | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  if (value in tokens) return tokens[value];
  if (value.startsWith("#") || value.startsWith("rgb")) return value;
  return undefined;
}
