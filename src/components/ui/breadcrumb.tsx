"use client";

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  /** Link to another route. */
  href?: string;
  /** In-page step, for a view that is state rather than a route. */
  onClick?: () => void;
};

type BreadcrumbProps = {
  /** Ancestors first; the last one is the current page. */
  items: BreadcrumbItem[];
  /** Accessible name for the nav landmark. */
  label: string;
};

/**
 * Trail of navigable ancestors ending in the current page, which is rendered as
 * the heading and never as a link.
 */
export function Breadcrumb({ items, label }: BreadcrumbProps) {
  const linkClass = "text-text-muted hover:text-foreground shrink-0 transition-colors";

  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-gray-400">
                  ›
                </span>
              )}
              {isCurrent ? (
                <h1 aria-current="page" className="text-foreground font-semibold">
                  {item.label}
                </h1>
              ) : item.href ? (
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ) : (
                <button type="button" onClick={item.onClick} className={linkClass}>
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
