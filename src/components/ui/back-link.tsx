"use client";

import type { MouseEvent, ReactNode } from "react";

import Link from "next/link";

import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { useBackNavigation } from "@/hooks/use-back-navigation";

type BackLinkProps = {
  /** Where to go when there's no previous app page, e.g. when opened directly. */
  fallbackHref: string;
  children: ReactNode;
  className?: string;
};

const DEFAULT_CLASS_NAME =
  "mb-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700";

/**
 * Back link that returns to the previous page. It stays a real link to
 * `fallbackHref`, so opening it in a new tab still works.
 */
export function BackLink({ fallbackHref, children, className }: BackLinkProps) {
  const goBack = useBackNavigation(fallbackHref);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab/window) follow the link.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    goBack();
  };

  return (
    <Link href={fallbackHref} onClick={handleClick} className={className ?? DEFAULT_CLASS_NAME}>
      <BackArrowIcon />
      {children}
    </Link>
  );
}
