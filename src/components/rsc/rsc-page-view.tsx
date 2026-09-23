"use client";

import type { ComponentType } from "react";

import { RscRenderContext } from "@/components/rsc/rsc-render-context";
import { VerticalList } from "@/components/rsc/sections/vertical-list";
import type { RscPageModel } from "@/lib/rsc/rsc-page-types";

export type RscSectionProps = { props: Record<string, unknown> };

/**
 * Web components for Picnic's page-platform sections, keyed by module name.
 * A page renders every section it has a component for; add an entry here to
 * support a new section type.
 */
const SECTION_COMPONENTS: Record<string, ComponentType<RscSectionProps>> = {
  "vertical-list": VerticalList,
};

type RscPageViewProps = {
  page: RscPageModel;
  onOpenDeepLink: (deepLink: string, title: string) => void;
};

/** Render a page Picnic serves as React Server Components with the web registry. */
export function RscPageView({ page, onOpenDeepLink }: RscPageViewProps) {
  return (
    <RscRenderContext.Provider value={{ tokens: page.tokens, onOpenDeepLink }}>
      {page.sections.map((section) => {
        const Section = SECTION_COMPONENTS[section.component];
        return Section ? <Section key={section.id} props={section.props} /> : null;
      })}
    </RscRenderContext.Provider>
  );
}
