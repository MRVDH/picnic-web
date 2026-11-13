"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslations } from "@/contexts/country-context";
import { useCompareList } from "@/hooks/use-compare-list";

/**
 * A floating link to the comparison while products are picked for it. It sits
 * above the mobile tab bar and stays out of the comparison page itself.
 */
export function CompareBar() {
  const t = useTranslations();
  const ids = useCompareList();
  const pathname = usePathname();

  if (ids.length === 0 || pathname === "/compare") return null;

  return (
    <Link
      href="/compare"
      className="fixed right-4 bottom-20 z-30 rounded-full bg-gray-800 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-gray-700 md:bottom-6"
    >
      {t.compareBar.replace("{count}", String(ids.length))}
    </Link>
  );
}
