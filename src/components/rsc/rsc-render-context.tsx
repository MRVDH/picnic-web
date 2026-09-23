"use client";

import { createContext, useContext } from "react";

export type RscRenderContextValue = {
  /** Design tokens from the page theme, e.g. "YELLOW2" → "#FBD92B". */
  tokens: Record<string, string>;
  /** Called when a component opens a Picnic deep link. */
  onOpenDeepLink: (deepLink: string, title: string) => void;
};

export const RscRenderContext = createContext<RscRenderContextValue>({
  tokens: {},
  onOpenDeepLink: () => {},
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
