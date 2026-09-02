"use client";

import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

import type { SearchSection } from "@/lib/core/types";

/**
 * Lets a page hand its result sections to the persistent header, which renders
 * them as the sticky SectionNavBar below the main nav. Pages call
 * useHeaderSections(sections); the bar disappears again when they unmount.
 */
const EMPTY_SECTIONS: SearchSection[] = [];

const HeaderSectionsContext = createContext<SearchSection[]>(EMPTY_SECTIONS);
const SetHeaderSectionsContext = createContext<(sections: SearchSection[]) => void>(() => {});

export function HeaderSectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SearchSection[]>(EMPTY_SECTIONS);
  return (
    <HeaderSectionsContext.Provider value={sections}>
      <SetHeaderSectionsContext.Provider value={setSections}>
        {children}
      </SetHeaderSectionsContext.Provider>
    </HeaderSectionsContext.Provider>
  );
}

/** Read by the header. */
export function useHeaderSections(): SearchSection[] {
  return useContext(HeaderSectionsContext);
}

/** Called by pages that have section anchors; clears them on unmount. */
export function usePublishHeaderSections(sections: SearchSection[]): void {
  const setSections = useContext(SetHeaderSectionsContext);
  // Callers often pass a fresh `[]` per render; normalize so the effect stays quiet.
  const stableSections = sections.length === 0 ? EMPTY_SECTIONS : sections;
  useEffect(() => {
    setSections(stableSections);
    return () => setSections(EMPTY_SECTIONS);
  }, [stableSections, setSections]);
}
