"use client";

import React from "react";
import { pmlColor } from "@/lib/pml-styles";

// Simple icon mapping for common Picnic icons
const ICON_SVGS: Record<string, string> = {
  // Chevrons / arrows
  chevron_right: "M9 18l6-6-6-6",
  rightchevron: "M9 18l6-6-6-6",
  chevron_left: "M15 18l-6-6 6-6",
  chevron_down: "M6 9l6 6 6-6",
  chevron_up: "M6 15l6-6 6 6",
  // Close / cross
  close: "M18 6L6 18M6 6l12 12",
  crosssmall: "M18 6L6 18M6 6l12 12",
  // Navigation & UI
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m-8-8h16",
  minus: "M4 12h16",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  cart: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  useravatar: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  // Decorative
  dotdivider: "M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0",
  percentage: "M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  stars: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  swap: "M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4",
  laurelleafleft: "M8 21c0-8 4-12 12-14M4 21c0-12 6-16 16-18",
  laurelleafright: "M16 21c0-8-4-12-12-14M20 21c0-12-6-16-16-18",
};

export function PMLIcon({ component }: { component: any }) {
  const iconKey = typeof component.iconKey === "string" ? component.iconKey : "close";
  const color = typeof component.color === "string" ? pmlColor(component.color) : "#333";
  const w = component.width || 24;
  const h = component.height || 24;
  const rotation = component.rotation || 0;

  // Normalize key: lowercase, strip non-alpha for flexible matching
  const normalizedKey = iconKey.toLowerCase().replace(/[^a-z]/g, "");
  const path = ICON_SVGS[normalizedKey] || ICON_SVGS[iconKey.toLowerCase()] || ICON_SVGS.close;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
    >
      <path d={path} />
    </svg>
  );
}
