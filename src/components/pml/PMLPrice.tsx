"use client";

import React from "react";
import { pmlColor } from "@/lib/pml-styles";

export function PMLPrice({ component }: { component: any }) {
  const price = component.price || 0;
  const euros = (price / 100).toFixed(2).replace(".", ",");
  const color = pmlColor(component.color) || "#333";
  const fontSize = component.fontSize || 14;

  const style: React.CSSProperties = {
    color,
    fontSize: `${fontSize}px`,
    fontWeight: 700,
    textDecoration: component.isCrossed ? "line-through" : undefined,
    opacity: component.opacity,
  };

  return (
    <span style={style}>
      {component.priceSign || ""}€{euros}
    </span>
  );
}
