"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { PMLRenderer } from "./PMLRenderer";
import { CategoryTreeProvider, useCategoryTreeState } from "./CategoryTreeContext";

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
      // Wrap CategoryTreeArticlesState in a provider for scroll-tracked active filter state
      if (node.id === "CategoryTreeArticlesState") {
        const defaultCatId = extractFirstCategoryId(node);
        return (
          <CategoryTreeProvider defaultCategoryId={defaultCatId}>
            <FusionNode node={node.child} parentAxis={parentAxis} />
          </CategoryTreeProvider>
        );
      }
      return <FusionNode node={node.child} parentAxis={parentAxis} />;

    case "SUSPENSE":
      // If we have a child already, render it directly
      if (node.child) return <FusionNode node={node.child} parentAxis={parentAxis} />;
      // If there's a pageConfig, lazy-load the content
      if (node.pageConfig?.id) return <FusionSuspenseLoader pageId={node.pageConfig.id} parentAxis={parentAxis} />;
      return null;

    case "BLOCK":
      return <FusionBlock block={node} parentAxis={parentAxis} sizeOverride={itemStyleOverride} />;

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

function FusionBlock({ block, parentAxis, sizeOverride }: { block: any; parentAxis?: string; sizeOverride?: React.CSSProperties }) {
  const layout = block.layout;
  const children = block.children || [];
  const isHorizontal = layout?.axis === "HORIZONTAL";
  const axis = layout?.axis || "VERTICAL";

  // Compute block's own sizing from parent axis context
  const blockSize = sizeOverride
    ? { ...fusionBlockSize(block.size, parentAxis), ...sizeOverride }
    : fusionBlockSize(block.size, parentAxis);

  // Check if children have fixed/computed widths — route to horizontal scroll block
  // Exclude the L2 category filter bar which needs sticky positioning
  const isCategoryFilterBar = block.id === "core-L2-category-page-horizontal-list-section";
  const hasFixedWidthItems = isHorizontal && !isCategoryFilterBar && children.some((c: any) => {
    const main = c.size?.mainAxis;
    if (!main) return false;
    if (typeof main === "number") return true;
    const s = String(main);
    return /^\d+$/.test(s) || s.includes("SCREEN_WIDTH");
  });

  if (isHorizontal && hasFixedWidthItems) {
    return <HorizontalScrollBlock block={block} layout={layout} children={children} blockSize={blockSize} />;
  }

  // Detect VERTICAL blocks with sub-full-width items (e.g. product tile grids).
  // These need flex-wrap to display as a grid instead of a single column.
  // Two cases:
  // 1. Direct SELLING_UNIT_TILE children → show 4 per row on web
  // 2. Sub-full-width crossAxis children (e.g. wrapper BLOCKs with "6g") → respect API sizing
  const hasDirectProductTiles = !isHorizontal && layout?.spacing?.crossAxis && children.some(
    (c: any) => c.content?.type === "SELLING_UNIT_TILE"
  );
  const hasSubFullWidthChildren = !isHorizontal && layout?.spacing?.crossAxis && !hasDirectProductTiles && children.some(
    (c: any) => {
      const cross = c.size?.crossAxis;
      if (!cross) return false;
      const s = String(cross);
      return s !== "12g" && s !== "SCREEN_WIDTH";
    }
  );
  const isVerticalGrid = hasDirectProductTiles || hasSubFullWidthChildren;

  const gap = layout?.spacing?.mainAxis || 0;
  const crossGap = layout?.spacing?.crossAxis || 0;

  // For direct product tile grids, show 4 per row on web.
  // For wrapped grids (sub-full-width BLOCKs), respect the API's crossAxis sizing.
  let gridItemStyle: React.CSSProperties | undefined;
  if (hasDirectProductTiles) {
    gridItemStyle = {
      width: `calc((100% - ${3 * crossGap}px) / 4)`,
      minWidth: `calc((100% - ${3 * crossGap}px) / 4)`,
      height: undefined,
      flexGrow: 0,
      flexShrink: 0,
    };
  } else if (hasSubFullWidthChildren) {
    gridItemStyle = {
      height: undefined,
      flexGrow: 0,
      flexShrink: 0,
    };
  }

  const style: React.CSSProperties = {
    ...blockSize,
    display: "flex",
    flexDirection: isVerticalGrid ? "row" : (isHorizontal ? "row" : "column"),
    flexWrap: isVerticalGrid ? "wrap" : (isHorizontal && layout?.wrap !== false ? "wrap" : undefined),
    gap: isVerticalGrid ? `${gap}px` : (layout?.spacing?.mainAxis ? `${layout.spacing.mainAxis}px` : undefined),
    columnGap: isVerticalGrid ? `${crossGap}px` : (!isHorizontal && layout?.spacing?.crossAxis ? `${layout.spacing.crossAxis}px` : undefined),
    rowGap: isHorizontal && layout?.spacing?.crossAxis ? `${layout.spacing.crossAxis}px` : undefined,
    padding: layout?.padding
      ? `${layout.padding.top ?? 0}px ${layout.padding.right ?? 0}px ${layout.padding.bottom ?? 0}px ${layout.padding.left ?? 0}px`
      : undefined,
    backgroundColor: layout?.backgroundColor,
    borderRadius: layout?.cornerRadius
      ? `${layout.cornerRadius.topLeft ?? 0}px ${layout.cornerRadius.topRight ?? 0}px ${layout.cornerRadius.bottomRight ?? 0}px ${layout.cornerRadius.bottomLeft ?? 0}px`
      : undefined,
    overflow: layout?.cornerRadius || layout?.overflow?.toUpperCase() === "HIDDEN" ? "hidden" : undefined,
    overflowX: isHorizontal ? "auto" : undefined,
    scrollbarWidth: "none",
    minWidth: 0,
    alignItems: mapBlockAlignment(layout?.alignment),
    justifyContent: mapBlockDistribution(layout?.distribution),
  };

  // If this block contains a sticky filter bar child, remove overflow: hidden
  // because overflow: hidden creates a clipping context that breaks sticky positioning
  const hasStickyChild = children.some((c: any) => c.id === "core-L2-category-page-horizontal-list-section");
  if (hasStickyChild && style.overflow === "hidden") {
    style.overflow = undefined;
  }

  // L2 category page: make the filter bar sticky (below the page header)
  if (isCategoryFilterBar) {
    style.position = "sticky";
    style.top = "calc(var(--nav-height) + var(--page-header-height))";
    style.zIndex = 40;
    style.backgroundColor = style.backgroundColor || "var(--picnic-white)";
    // Prevent overflow hidden from cutting off sticky
    style.overflow = undefined;
    style.overflowX = "auto";
    style.flexWrap = "nowrap";
    style.scrollbarWidth = "none";
  }

  // L2 category page: vertical list section with scroll tracking
  const isCategoryVerticalList = block.id === "core-L2-category-page-vertical-list-section";

  return (
    <div id={block.id || undefined} style={style} className={isHorizontal ? "fusion-block--horizontal" : "fusion-block"}>
      {isCategoryVerticalList
        ? children.map((child: any, i: number) => (
            <CategorySectionObserver key={child.id || i} sectionNode={child}>
              <FusionNode node={child} parentAxis={hasDirectProductTiles ? "HORIZONTAL" : axis} itemStyleOverride={gridItemStyle} />
            </CategorySectionObserver>
          ))
        : children.map((child: any, i: number) => {
            return <FusionNode key={child.id || i} node={child} parentAxis={hasDirectProductTiles ? "HORIZONTAL" : axis} itemStyleOverride={gridItemStyle} />;
          })
      }
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
        height: undefined,
        flexGrow: 0,
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
        {children.map((child: any, i: number) => {
          return <FusionNode key={child.id || i} node={child} parentAxis="HORIZONTAL" itemStyleOverride={productTileStyle} />;
        })}
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

  const itemId = item.id || undefined;

  // Category filter items: render with active-state-aware styling
  if (itemId?.startsWith("category-tree-page-filter-item-") && item.pml?.component) {
    const categoryId = itemId.replace("category-tree-page-filter-item-", "");
    // Skip workaround/placeholder items
    if (categoryId && !categoryId.includes("workaround")) {
      return (
        <div id={itemId} className="fusion-pml-item" style={style}>
          <CategoryFilterItem categoryId={categoryId} component={item.pml.component} />
        </div>
      );
    }
  }

  // When content is SELLING_UNIT_TILE and we have a PML tree, prefer the PML tree
  // because it includes discount labels, subtexts, original prices, bundle badges, etc.
  // The simple content.sellingUnit only has basic price/name data.
  if (item.content?.type === "SELLING_UNIT_TILE" && item.pml?.component) {
    return (
      <div id={itemId} className="fusion-pml-item" style={style}>
        <PMLRenderer component={item.pml.component} images={item.pml.images} />
      </div>
    );
  }

  // Fallback for SELLING_UNIT_TILE without PML tree
  if (item.content?.type === "SELLING_UNIT_TILE") {
    return (
      <div id={itemId} className="fusion-pml-item" style={style}>
        <PMLRenderer component={item.content} />
      </div>
    );
  }

  if (!item.pml?.component) {
    return null;
  }

  return (
    <div id={itemId} className="fusion-pml-item" style={style}>
      <PMLRenderer component={item.pml.component} images={item.pml.images} />
    </div>
  );
}

/**
 * Renders a category filter pill with active-state styling.
 * The active filter gets a RED1 background with white text,
 * inactive ones get GREY1 background with dark text.
 */
function CategoryFilterItem({ categoryId, component }: { categoryId: string; component: any }) {
  const { focusedCategoryId, setFocusedCategoryId } = useCategoryTreeState();
  const isActive = focusedCategoryId === categoryId;

  // Extract the label from the PML tree
  const label = extractFilterLabel(component);

  const handleClick = () => {
    setFocusedCategoryId(categoryId);
    const target = document.getElementById(`vertical-article-tiles-sub-header-${categoryId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className="category-filter-pill"
      style={{
        backgroundColor: isActive ? "#e1171e" : "#f8f5f2",
        borderRadius: 20,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 16px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background-color 0.2s, color 0.2s",
      }}
    >
      <span style={{
        fontSize: 14,
        fontWeight: 500,
        color: isActive ? "#ffffff" : "#333333",
      }}>
        {label}
      </span>
    </div>
  );
}

function extractFilterLabel(component: any): string {
  if (!component) return "";
  // The label is in: TOUCHABLE > CONTAINER > STACK > RICH_TEXT.markdown
  // The markdown is an EXPRESSION like: `condition ? \`#(WHITE)Label#(WHITE)\` : \`#(GREY5)Label#(GREY5)\``
  // Extract the label text from it
  if (component.markdown) {
    const md = typeof component.markdown === "string" ? component.markdown : "";
    if (typeof component.markdown === "object" && component.markdown.expression) {
      const expr: string = component.markdown.expression;
      const match = expr.match(/`#\([^)]*\)([^#]+)#\(/);
      if (match) return match[1];
    }
    return md.replace(/#\([^)]*\)/g, "").trim();
  }
  if (component.child) {
    const r = extractFilterLabel(component.child);
    if (r) return r;
  }
  if (component.children) {
    for (const c of component.children) {
      const r = extractFilterLabel(c);
      if (r) return r;
    }
  }
  return "";
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

/**
 * Extract the first category ID from a CategoryTreeArticlesState boundary.
 * Walks the tree to find the first filter item and extracts its category ID.
 */
function extractFirstCategoryId(node: any): string | undefined {
  if (!node) return undefined;
  if (node.id?.startsWith("category-tree-page-filter-item-")) {
    return node.id.replace("category-tree-page-filter-item-", "");
  }
  if (node.child) {
    const r = extractFirstCategoryId(node.child);
    if (r) return r;
  }
  if (node.children) {
    for (const c of node.children) {
      const r = extractFirstCategoryId(c);
      if (r) return r;
    }
  }
  return undefined;
}

/**
 * Wraps each category section and observes when it scrolls into view.
 * Updates the CategoryTreeState context so the filter bar highlights the right tab.
 */
function CategorySectionObserver({ sectionNode, children }: { sectionNode: any; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { setFocusedCategoryId } = useCategoryTreeState();

  // Extract category ID from the sub-header within this section
  const categoryId = extractSubHeaderCategoryId(sectionNode);

  useEffect(() => {
    if (!ref.current || !categoryId) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setFocusedCategoryId(categoryId);
          }
        }
      },
      { rootMargin: "-160px 0px -60% 0px", threshold: 0 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [categoryId, setFocusedCategoryId]);

  return <div ref={ref}>{children}</div>;
}

function extractSubHeaderCategoryId(node: any): string | undefined {
  if (!node) return undefined;
  if (typeof node.id === "string" && node.id.startsWith("vertical-article-tiles-sub-header-") && !node.id.includes("__")) {
    return node.id.replace("vertical-article-tiles-sub-header-", "");
  }
  if (node.child) {
    const r = extractSubHeaderCategoryId(node.child);
    if (r) return r;
  }
  if (node.children) {
    for (const c of node.children) {
      const r = extractSubHeaderCategoryId(c);
      if (r) return r;
    }
  }
  return undefined;
}
