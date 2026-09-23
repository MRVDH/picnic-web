"use client";

import type { ComponentType, ReactNode } from "react";

import { RowItem } from "@/components/rsc/items/row-item";
import { SectionTitle } from "@/components/rsc/items/section-title";
import type { RscComponentProps } from "@/components/rsc/rsc-page-view";

export type RscItemProps = { item: Record<string, unknown>; isLast: boolean };

/** Item components inside a vertical list, keyed by the item's `type`. */
const ITEM_COMPONENTS: Record<string, ComponentType<RscItemProps>> = {
  "row-item": RowItem,
};

/**
 * A vertical list of items. Consecutive rows are grouped into one card, and a
 * `section-title` item starts a new group under its heading, e.g. the
 * shortcuts, then "Alle categorieën" and the categories.
 */
export function VerticalList({ node }: RscComponentProps) {
  const { props } = node;
  const items = Array.isArray(props.items) ? (props.items as Record<string, unknown>[]) : [];

  const blocks: ReactNode[] = [];
  let group: Record<string, unknown>[] = [];

  const flushGroup = () => {
    if (group.length === 0) return;
    const rows = group;
    blocks.push(
      <div
        key={`group-${blocks.length}`}
        className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm"
      >
        {rows.map((item, index) => {
          const Item = ITEM_COMPONENTS[String(item.type)];
          return (
            <Item
              key={String(item.testID ?? index)}
              item={item}
              isLast={index === rows.length - 1}
            />
          );
        })}
      </div>
    );
    group = [];
  };

  for (const item of items) {
    if (item.type === "section-title") {
      flushGroup();
      blocks.push(<SectionTitle key={`title-${blocks.length}`} item={item} isLast={false} />);
    } else if (String(item.type) in ITEM_COMPONENTS) {
      group.push(item);
    }
  }
  flushGroup();

  return <div>{blocks}</div>;
}
