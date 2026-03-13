"use client";

import React from "react";
import { PMLRenderer } from "./PMLRenderer";
import { useRouter } from "next/navigation";

export function PMLTouchable({ component, images }: { component: any; images?: Record<string, string> }) {
  const router = useRouter();

  const handlePress = () => {
    if (!component.onPress) return;

    const action = component.onPress;

    if (action.actionType === "OPEN" && action.target) {
      const target: string = action.target;

      // Handle Picnic deeplinks (format: store/page;id=pageId,key=val,key2=val2)
      if (target.includes("store/page;id=")) {
        const rest = target.split("store/page;id=")[1];
        if (rest) {
          const parts = rest.split(",");
          const pageId = parts[0];
          const qs = parts.slice(1).join("&");
          router.push(qs ? `/page/${pageId}?${qs}` : `/page/${pageId}`);
          return;
        }
      }

      // Handle product page links
      if (target.includes("product-details-page-root")) {
        const match = target.match(/id=([^&]+)/);
        if (match) {
          router.push(`/page/product-details-page-root?id=${match[1]}`);
          return;
        }
      }

      // Handle category links
      if (target.includes("category")) {
        const match = target.match(/category_id=([^&]+)/);
        if (match) {
          const pageId = target.includes("L2") ? "L2-category-page-root" : "L1-category-page-root";
          router.push(`/page/${pageId}?category_id=${match[1]}`);
          return;
        }
      }

      // Handle search links
      if (target.includes("search")) {
        const match = target.match(/search_term=([^&]+)/);
        if (match) {
          router.push(`/search?q=${encodeURIComponent(match[1])}`);
          return;
        }
      }

      // External URL
      if (target.startsWith("http")) {
        window.open(target, "_blank");
        return;
      }
    }
  };

  const style: React.CSSProperties = {
    cursor: component.onPress ? "pointer" : "default",
    backgroundColor: component.backgroundColor,
    borderRadius: component.borderRadius ? `${component.borderRadius}px` : undefined,
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.1s, opacity 0.1s",
  };

  return (
    <div
      style={style}
      onClick={handlePress}
      role={component.onPress ? "button" : undefined}
      tabIndex={component.onPress ? 0 : undefined}
      aria-label={typeof component.accessibilityLabel === "string" ? component.accessibilityLabel : undefined}
      aria-hint={typeof component.accessibilityHint === "string" ? component.accessibilityHint : undefined}
      className="touchable"
    >
      {component.child && <PMLRenderer component={component.child} images={images} />}
    </div>
  );
}
