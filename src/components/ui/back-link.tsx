"use client";

import Link from "next/link";

import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { useTranslations } from "@/contexts/country-context";

type BackLinkProps = {
  /** Route to go to. Pass this or `onClick`, not both. */
  href?: string;
  /** In-page step, for a view that is state rather than a route. */
  onClick?: () => void;
  /** Name of the destination. Defaults to the generic "back" wording. */
  label?: string;
  className?: string;
};

/** The "back" link every section shows above its heading. */
export function BackLink({ href, onClick, label, className = "" }: BackLinkProps) {
  const t = useTranslations();
  const classes = `text-picnic-red hover:text-picnic-red-dark inline-flex items-center gap-1 text-sm font-medium transition-colors ${className}`;
  const content = (
    <>
      <BackArrowIcon />
      {label ?? t.backButton}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
