"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { PMLRenderer } from "./PMLRenderer";

/**
 * Renders a Fusion page body tree (STATE_BOUNDARY → BLOCK → PML).
 * This handles the outer page layout structure while PMLRenderer handles inner components.
 */
export function FusionPageRenderer({ body }: { body: any }) {
  if (!body) return null;
  return <FusionNode node={body} />;
}

function FusionNode({ node, parentAxis, itemStyleOverride }: { node: any; parentAxis?: string; itemStyleOverride?: React.CSSProperties }) {
  if (!node) return null;
  if (node.isHidden) return null;

  switch (node.type) {
    case "STATE_BOUNDARY":
      return <FusionNode node={node.child} parentAxis={parentAxis} />;

    case "SUSPENSE":
      // If we have a child already, render it directly
      if (node.child) return <FusionNode node={node.child} parentAxis={parentAxis} />;
      // If there's a pageConfig, lazy-load the content
      if (node.pageConfig?.id) return <FusionSuspenseLoader pageId={node.pageConfig.id} parentAxis={parentAxis} />;
      return null;

    case "BLOCK":
      return <FusionBlock block={node} parentAxis={parentAxis} />;

    case "PML":
      return <FusionPMLItem item={node} parentAxis={parentAxis} styleOverride={itemStyleOverride} />;

    default:
      return null;
  }
}

function FusionSuspenseLoader({ pageId, parentAxis }: { pageId: string; parentAxis?: string }) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pages/${pageId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setContent(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageId]);

  if (loading) {
    return (
      <div className="pml-activity-indicator">
        <div className="pml-spinner" />
      </div>
    );
  }

  if (!content?.body) return null;

  return <FusionNode node={content.body} parentAxis={parentAxis} />;
}

function FusionBlock({ block, parentAxis }: { block: any; parentAxis?: string }) {
  const layout = block.layout;
  const children = block.children || [];
  const isHorizontal = layout?.axis === "HORIZONTAL";
  const axis = layout?.axis || "VERTICAL";

  // Compute block's own sizing from parent axis context
  const blockSize = fusionBlockSize(block.size, parentAxis);

  // Check if children have fixed/computed widths — route to horizontal scroll block
  const hasFixedWidthItems = isHorizontal && children.some((c: any) => {
    const main = c.size?.mainAxis;
    if (!main) return false;
    if (typeof main === "number") return true;
    const s = String(main);
    return /^\d+$/.test(s) || s.includes("SCREEN_WIDTH");
  });

  if (isHorizontal && hasFixedWidthItems) {
    return <HorizontalScrollBlock block={block} layout={layout} children={children} blockSize={blockSize} />;
  }

  const style: React.CSSProperties = {
    ...blockSize,
    display: "flex",
    flexDirection: isHorizontal ? "row" : "column",
    gap: layout?.spacing?.mainAxis ? `${layout.spacing.mainAxis}px` : undefined,
    rowGap: isHorizontal && layout?.spacing?.crossAxis ? `${layout.spacing.crossAxis}px` : undefined,
    columnGap: !isHorizontal && layout?.spacing?.crossAxis ? `${layout.spacing.crossAxis}px` : undefined,
    padding: layout?.padding
      ? `${layout.padding.top ?? 0}px ${layout.padding.right ?? 0}px ${layout.padding.bottom ?? 0}px ${layout.padding.left ?? 0}px`
      : undefined,
    backgroundColor: layout?.backgroundColor,
    borderRadius: layout?.cornerRadius
      ? `${layout.cornerRadius.topLeft ?? 0}px ${layout.cornerRadius.topRight ?? 0}px ${layout.cornerRadius.bottomRight ?? 0}px ${layout.cornerRadius.bottomLeft ?? 0}px`
      : undefined,
    overflow: layout?.cornerRadius || layout?.overflow === "hidden" ? "hidden" : undefined,
    overflowX: isHorizontal ? "auto" : undefined,
    scrollbarWidth: "none",
    minWidth: 0,
    flexWrap: isHorizontal && layout?.wrap !== false ? "wrap" : undefined,
    alignItems: mapBlockAlignment(layout?.alignment),
    justifyContent: mapBlockDistribution(layout?.distribution),
  };

  return (
    <div style={style} className={isHorizontal ? "fusion-block--horizontal" : "fusion-block"}>
      {children.map((child: any, i: number) => (
        <FusionNode key={child.id || i} node={child} parentAxis={axis} />
      ))}
    </div>
  );
}

function HorizontalScrollBlock({ block, layout, children, blockSize }: { block: any; layout: any; children: any[]; blockSize: React.CSSProperties }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Detect product tile rows and calculate sizing for 4 per row
  const hasProductTiles = children.some(
    (c: any) => c.content?.type === "SELLING_UNIT_TILE"
  );
  const gap = layout?.spacing?.mainAxis || 0;
  const productTileStyle: React.CSSProperties | undefined = hasProductTiles
    ? {
        width: `calc((100% - ${3 * gap}px) / 4)`,
        minWidth: `calc((100% - ${3 * gap}px) / 4)`,
        flexShrink: 0,
      }
    : undefined;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: layout?.spacing?.mainAxis ? `${layout.spacing.mainAxis}px` : undefined,
    padding: layout?.padding
      ? `${layout.padding.top ?? 0}px ${layout.padding.right ?? 0}px ${layout.padding.bottom ?? 0}px ${layout.padding.left ?? 0}px`
      : undefined,
    backgroundColor: layout?.backgroundColor,
    borderRadius: layout?.cornerRadius
      ? `${layout.cornerRadius.topLeft ?? 0}px ${layout.cornerRadius.topRight ?? 0}px ${layout.cornerRadius.bottomRight ?? 0}px ${layout.cornerRadius.bottomLeft ?? 0}px`
      : undefined,
    overflowX: "auto",
    width: "100%",
    scrollbarWidth: "none",
    minWidth: 0,
  };

  return (
    <div className="horizontal-scroll-wrapper" style={{ width: blockSize.width || "100%" }}>
      {canScrollLeft && (
        <button
          className="horizontal-scroll-btn horizontal-scroll-btn--left"
          onClick={() => scroll("left")}
          aria-label="Scroll naar links"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      )}
      <div ref={scrollRef} style={style} className="fusion-block--horizontal">
        {children.map((child: any, i: number) => (
          <FusionNode key={child.id || i} node={child} parentAxis="HORIZONTAL" itemStyleOverride={productTileStyle} />
        ))}
      </div>
      {canScrollRight && (
        <button
          className="horizontal-scroll-btn horizontal-scroll-btn--right"
          onClick={() => scroll("right")}
          aria-label="Scroll naar rechts"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}
    </div>
  );
}

function FusionPMLItem({ item, parentAxis, styleOverride }: { item: any; parentAxis?: string; styleOverride?: React.CSSProperties }) {
  const baseStyle = fusionItemSize(item, parentAxis);
  const style = styleOverride ? { ...baseStyle, ...styleOverride } : baseStyle;

  // When content exists (e.g. SELLING_UNIT_TILE), render only the content.
  // The pml.component in this case is a native interaction wrapper (steppers, 
  // touch targets, mutations) that duplicates the visual tile — skip it.
  if (item.content?.type === "SELLING_UNIT_TILE") {
    return (
      <div className="fusion-pml-item" style={style}>
        <PMLRenderer component={item.content} />
      </div>
    );
  }

  if (!item.pml?.component) {
    return null;
  }

  return (
    <div className="fusion-pml-item" style={style}>
      <PMLRenderer component={item.pml.component} images={item.pml.images} />
    </div>
  );
}

function fusionItemSize(item: any, parentAxis?: string): React.CSSProperties {
  const size = item.size;
  if (!size) return {};

  const parseFusionSize = (val: any): string | undefined => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "number") return `${val}px`;
    const s = String(val);
    if (s.endsWith("%")) return s;
    if (/^\d+$/.test(s)) return `${s}px`;
    if (/^\d+\.\d+$/.test(s)) return `${s}px`;
    // 12g = full width (12 grid columns)
    if (s === "12g") return "100%";
    const gridMatch = s.match(/^(\d+)g$/);
    if (gridMatch) return `${(parseInt(gridMatch[1]) / 12) * 100}%`;
    if (s === "SCREEN_WIDTH") return "100%";
    if (s === "SCREEN_HEIGHT") return "100vh";
    if (s === "CONTAINER_HEIGHT") return "auto";
    // SCREEN_WIDTH expressions → CSS calc()
    if (s.includes("SCREEN_WIDTH")) {
      const calcExpr = s.replace(/SCREEN_WIDTH/g, "var(--content-width, 100vw)");
      return `calc(${calcExpr})`;
    }
    return undefined;
  };

  const mainSize = parseFusionSize(size.mainAxis);
  const crossSize = parseFusionSize(size.crossAxis);

  // In a VERTICAL block: mainAxis = height, crossAxis = width
  // In a HORIZONTAL block: mainAxis = width, crossAxis = height
  const isVertical = parentAxis !== "HORIZONTAL";
  const hasFixedMainSize = mainSize !== undefined;

  if (isVertical) {
    return {
      width: crossSize,
      minWidth: crossSize,
      height: mainSize,
      flexShrink: hasFixedMainSize ? 0 : undefined,
      flexGrow: hasFixedMainSize ? undefined : 1,
    };
  }

  return {
    width: mainSize,
    minWidth: mainSize,
    height: crossSize,
    flexShrink: hasFixedMainSize ? 0 : undefined,
    flexGrow: hasFixedMainSize ? undefined : 1,
  };
}

function mapBlockAlignment(alignment?: string): string | undefined {
  switch (alignment) {
    case "START": return "flex-start";
    case "END": return "flex-end";
    case "CENTER": return "center";
    case "FILL": return "stretch";
    default: return undefined;
  }
}

function mapBlockDistribution(distribution?: string): string | undefined {
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

function fusionBlockSize(size: any, parentAxis?: string): React.CSSProperties {
  if (!size) return { width: "100%" };

  const parse = (val: any): string | undefined => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "number") return `${val}px`;
    const s = String(val);
    if (/^\d+$/.test(s)) return `${s}px`;
    if (/^\d+\.\d+$/.test(s)) return `${s}px`;
    if (s === "12g" || s === "SCREEN_WIDTH") return "100%";
    const gridMatch = s.match(/^(\d+)g$/);
    if (gridMatch) return `${(parseInt(gridMatch[1]) / 12) * 100}%`;
    if (s === "SCREEN_HEIGHT") return "100vh";
    if (s === "CONTAINER_HEIGHT") return undefined; // auto
    if (s.includes("SCREEN_WIDTH")) {
      const calcExpr = s.replace(/SCREEN_WIDTH/g, "var(--content-width, 100vw)");
      return `calc(${calcExpr})`;
    }
    return undefined;
  };

  const mainSize = parse(size.mainAxis);
  const crossSize = parse(size.crossAxis);
  const isVertical = parentAxis !== "HORIZONTAL";

  if (isVertical) {
    return {
      width: crossSize || "100%",
      height: mainSize,
    };
  }
  return {
    width: mainSize,
    height: crossSize,
  };
}
