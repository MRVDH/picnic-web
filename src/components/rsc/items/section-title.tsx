"use client";

import type { RscItemProps } from "@/components/rsc/sections/vertical-list";

/** A heading between groups of rows, e.g. "Alle categorieën". */
export function SectionTitle({ item }: RscItemProps) {
  if (typeof item.title !== "string" || item.title === "") return null;
  return <h2 className="text-foreground mb-3 text-lg font-semibold">{item.title}</h2>;
}
