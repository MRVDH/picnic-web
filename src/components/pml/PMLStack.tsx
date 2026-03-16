"use client";

import React from "react";
import { PMLRenderer } from "./PMLRenderer";
import { pmlColor, pmlPadding, pmlSize } from "@/lib/pml-styles";

export function PMLStack({ component, images }: { component: any; images?: Record<string, string> }) {
  const isVertical = component.axis !== "HORIZONTAL";
  const children = component.children || [];

  // Check if any child uses absolute positioning (e.g. background images)
  const hasAbsoluteChild = children.some((c: any) => c.absolutePosition);

  const cornerRadius = component.cornerRadius || component.borderRadius;

  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    gap: component.spacing ? `${component.spacing}px` : undefined,
    padding: pmlPadding(component.padding),
    backgroundColor: pmlColor(component.backgroundColor),
    width: pmlSize(component.width),
    height: pmlSize(component.height),
    flexWrap: component.wrap === "WRAP" ? "wrap" : undefined,
    alignItems: mapAlignment(component.alignment),
    justifyContent: mapDistribution(component.distribution),
    minWidth: 0,
    minHeight: 0,
    position: hasAbsoluteChild || component.absolutePosition ? "relative" : undefined,
    borderRadius: cornerRadius ? `${cornerRadius}px` : undefined,
    borderWidth: component.borderWidth ? `${component.borderWidth}px` : undefined,
    borderColor: pmlColor(component.borderColor),
    borderStyle: component.borderWidth ? "solid" : undefined,
    overflow: component.overflow === "hidden" || cornerRadius ? "hidden" : undefined,
    opacity: component.opacity,
    ...(component.shadow && {
      boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
    }),
    ...(component.absolutePosition && {
      position: "absolute" as const,
      top: component.absolutePosition.top !== undefined ? `${component.absolutePosition.top}px` : undefined,
      right: component.absolutePosition.right !== undefined ? `${component.absolutePosition.right}px` : undefined,
      bottom: component.absolutePosition.bottom !== undefined ? `${component.absolutePosition.bottom}px` : undefined,
      left: component.absolutePosition.left !== undefined ? `${component.absolutePosition.left}px` : undefined,
    }),
  };

  return (
    <div style={style} aria-label={component.accessibilityLabel} role={component.accessible ? "group" : undefined}>
      {children.map((child: any, i: number) => {
        // Absolute children need position: absolute with their coordinates
        if (child.absolutePosition) {
          const absStyle: React.CSSProperties = {
            position: "absolute",
            top: child.absolutePosition.top !== undefined ? `${child.absolutePosition.top}px` : undefined,
            right: child.absolutePosition.right !== undefined ? `${child.absolutePosition.right}px` : undefined,
            bottom: child.absolutePosition.bottom !== undefined ? `${child.absolutePosition.bottom}px` : undefined,
            left: child.absolutePosition.left !== undefined ? `${child.absolutePosition.left}px` : undefined,
          };
          // Strip absolutePosition so the child component doesn't also apply it,
          // which would create a nested absolute chain with a 0-sized containing block
          const { absolutePosition: _, ...childWithoutAbsPos } = child;
          return (
            <div key={i} style={absStyle}>
              <PMLRenderer component={childWithoutAbsPos} images={images} />
            </div>
          );
        }
        // Non-absolute siblings need position: relative so they paint above absolute siblings
        if (hasAbsoluteChild) {
          return (
            <div key={i} style={{ position: "relative", alignSelf: "stretch", minWidth: 0 }}>
              <PMLRenderer component={child} images={images} />
            </div>
          );
        }
        return <PMLRenderer key={i} component={child} images={images} />;
      })}
    </div>
  );
}

function mapAlignment(alignment?: string): string | undefined {
  switch (alignment) {
    case "START": return "flex-start";
    case "END": return "flex-end";
    case "CENTER": return "center";
    case "FILL": return "stretch";
    default: return undefined;
  }
}

function mapDistribution(distribution?: string): string | undefined {
  switch (distribution) {
    case "START": return "flex-start";
    case "END": return "flex-end";
    case "CENTER": return "center";
    case "FILL": return "stretch";
    case "SPACE_BETWEEN": return "space-between";
    case "SPACE_AROUND": return "space-around";
    default: return undefined;
  }
}
