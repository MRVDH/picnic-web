"use client";

import React from "react";
import { getImageUrl } from "@/lib/image-url";
import { pmlSize } from "@/lib/pml-styles";

export function PMLImage({ component, images }: { component: any; images?: Record<string, string> }) {
  const imageKey = component.source?.id;
  if (!imageKey) return null;

  // Resolve the actual image hash from the images map, or use the key directly
  const imageHash = images?.[imageKey] || imageKey;

  // If the resolved value is already a full URL, use it directly
  // Note: always use .png — the CDN serves png regardless of what the PML data says
  const resolvedUrl = imageHash.startsWith("http")
    ? imageHash
    : getImageUrl(imageHash, "medium");

  const style: React.CSSProperties = {
    width: pmlSize(component.width) || "100%",
    height: pmlSize(component.height) || "auto",
    objectFit: mapResizeMode(component.resizeMode),
    aspectRatio: component.aspectRatio,
    opacity: component.opacity,
    borderRadius: component.cornerRadius || component.borderRadius
      ? `${component.cornerRadius || component.borderRadius}px`
      : undefined,
    ...(component.absolutePosition && {
      position: "absolute" as const,
      top: component.absolutePosition.top !== undefined ? `${component.absolutePosition.top}px` : undefined,
      right: component.absolutePosition.right !== undefined ? `${component.absolutePosition.right}px` : undefined,
      bottom: component.absolutePosition.bottom !== undefined ? `${component.absolutePosition.bottom}px` : undefined,
      left: component.absolutePosition.left !== undefined ? `${component.absolutePosition.left}px` : undefined,
    }),
  };

  return (
    <img
      src={resolvedUrl}
      alt=""
      style={style}
      loading="lazy"
    />
  );
}

function mapResizeMode(mode?: string): React.CSSProperties["objectFit"] {
  switch (mode) {
    case "COVER": return "cover";
    case "CONTAIN": return "contain";
    case "STRETCH": return "fill";
    default: return "contain";
  }
}
