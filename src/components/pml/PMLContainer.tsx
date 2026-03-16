"use client";

import React from "react";
import { PMLRenderer } from "./PMLRenderer";
import { pmlColor, pmlPadding, pmlSize } from "@/lib/pml-styles";

export function PMLContainer({ component, images }: { component: any; images?: Record<string, string> }) {
  const children = component.children || (component.child ? [component.child] : []);

  const hasAbsoluteChild = children.some((c: any) => c.absolutePosition);
  const cornerRadius = component.cornerRadius || component.borderRadius;

  const style: React.CSSProperties = {
    display: children.length > 1 ? "flex" : undefined,
    flexDirection: children.length > 1 ? "column" : undefined,
    width: pmlSize(component.width),
    height: pmlSize(component.height),
    backgroundColor: pmlColor(component.backgroundColor),
    borderRadius: cornerRadius ? `${cornerRadius}px` : undefined,
    borderWidth: component.borderWidth ? `${component.borderWidth}px` : undefined,
    borderColor: pmlColor(component.borderColor),
    borderStyle: component.borderWidth ? "solid" : undefined,
    overflow: component.overflow === "hidden" || cornerRadius ? "hidden" : undefined,
    padding: pmlPadding(component.padding),
    aspectRatio: component.aspectRatio,
    opacity: component.opacity,
    position: component.absolutePosition ? "absolute" : hasAbsoluteChild ? "relative" : undefined,
    ...(component.absolutePosition && {
      top: component.absolutePosition.top !== undefined ? `${component.absolutePosition.top}px` : undefined,
      right: component.absolutePosition.right !== undefined ? `${component.absolutePosition.right}px` : undefined,
      bottom: component.absolutePosition.bottom !== undefined ? `${component.absolutePosition.bottom}px` : undefined,
      left: component.absolutePosition.left !== undefined ? `${component.absolutePosition.left}px` : undefined,
    }),
    ...(component.shadow && {
      boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
    }),
    pointerEvents: component.pointerEvents === "box-none" ? "none" : component.pointerEvents === "none" ? "none" : undefined,
    minWidth: 0,
  };

  return (
    <div
      style={style}
      aria-label={component.accessibilityLabel}
      role={component.accessible ? "group" : undefined}
    >
      {children.map((child: any, i: number) => (
        <PMLRenderer key={i} component={child} images={images} />
      ))}
    </div>
  );
}
