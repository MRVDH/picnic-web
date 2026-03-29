"use client";

import { forwardRef, useCallback, useEffect, useRef } from "react";
import type { SearchSection } from "@/lib/types";
import { buildSectionId } from "@/lib/types";
import { useScrollSpy } from "@/hooks/use-scroll-spy";

type SectionNavBarProps = {
  sections: SearchSection[];
};

export function SectionNavBar({ sections }: SectionNavBarProps) {
  const activeSectionIndex = useScrollSpy(sections.length);
  const badgeRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Auto-scroll the badge bar to keep the active badge visible.
  useEffect(() => {
    const el = badgeRefs.current.get(activeSectionIndex);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSectionIndex]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Section navigation"
      className="border-t border-card-border bg-white/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-2">
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

const SectionBadge = forwardRef<HTMLButtonElement, SectionBadgeProps>(
  function SectionBadge({ index, title, isActive }, ref) {
    const handleClick = useCallback(() => {
      const element = document.getElementById(buildSectionId(index));
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, [index]);

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
          isActive
            ? "bg-picnic-red text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {title}
      </button>
    );
  },
);
