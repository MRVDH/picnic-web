"use client";

import { useState, useEffect } from "react";
import { buildSectionId } from "@/lib/types";

/**
 * Observes section elements via IntersectionObserver and returns the index
 * of the section nearest the top of the viewport.
 *
 * @param sectionCount - Number of sections to observe.
 * @returns The zero-based index of the currently active section.
 */
export function useScrollSpy(sectionCount: number): number {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  useEffect(() => {
    if (sectionCount === 0) return;

    // Collect all section elements that exist in the DOM.
    const elements: Element[] = [];
    for (let i = 0; i < sectionCount; i++) {
      const el = document.getElementById(buildSectionId(i));
      if (el) elements.push(el);
    }

    if (elements.length === 0) return;

    // rootMargin: negative top margin accounts for sticky header + badge bar
    // height (~112px). This shifts the effective "top" of the viewport down,
    // so a section is only considered intersecting once it clears the sticky
    // elements. Bottom margin of -60% means only the top ~40% of the viewport
    // is used for detection.
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section by picking the entry with the
        // smallest positive boundingClientRect.top among intersecting entries.
        let topEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (
            topEntry === null ||
            entry.boundingClientRect.top < topEntry.boundingClientRect.top
          ) {
            topEntry = entry;
          }
        }

        if (topEntry) {
          const idx = elements.indexOf(topEntry.target);
          if (idx !== -1) setActiveSectionIndex(idx);
        }
      },
      {
        rootMargin: "-144px 0px -60% 0px",
        threshold: 0,
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionCount]);

  return activeSectionIndex;
}
