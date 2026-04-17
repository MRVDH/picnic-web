"use client";

import { forwardRef, useEffect, useRef } from "react";
import type { SearchSection } from "@/lib/types";
import { buildSectionId } from "@/lib/types";
import { useScrollSpy } from "@/hooks/use-scroll-spy";

type SectionNavBarProps = {
  sections: SearchSection[];
};

export function SectionNavBar({ sections }: SectionNavBarProps) {
  const activeSectionIndex = useScrollSpy(sections.length);
  const badgeRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the badge bar to keep the active badge visible.
  useEffect(() => {
    const el = badgeRefs.current.get(activeSectionIndex);
    const container = scrollContainerRef.current;
    if (el && container) {
      // Calculate scroll position to center the badge within the container,
      // without using scrollIntoView which would also scroll the page vertically.
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScroll = elLeft - containerWidth / 2 + elWidth / 2;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  }, [activeSectionIndex]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Section navigation"
      className="border-t border-card-border bg-white/95 backdrop-blur-sm"
    >
      <div
        ref={scrollContainerRef}
        className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-2"
      >
        {sections.map((section, index) => (
          <SectionBadge
            key={index}
            ref={(el) => {
              if (el) {
                badgeRefs.current.set(index, el);
              } else {
                badgeRefs.current.delete(index);
              }
            }}
            index={index}
            title={section.title}
            isActive={index === activeSectionIndex}
          />
        ))}
      </div>
    </nav>
  );
}

type SectionBadgeProps = {
  index: number;
  title: string;
  isActive: boolean;
};

const SectionBadge = forwardRef<HTMLAnchorElement, SectionBadgeProps>(
  function SectionBadge({ index, title, isActive }, ref) {
    return (
      <a
        ref={ref}
        href={`#${buildSectionId(index)}`}
        aria-label={`Ga naar ${title}`}
        aria-current={isActive ? "true" : undefined}
        className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors no-underline ${
          isActive
            ? "bg-picnic-red text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {title}
      </a>
    );
  },
);
