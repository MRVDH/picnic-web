import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { PromotionGroupCard as PromotionGroupCardData } from "@/lib/core/types";

/**
 * A promotion on several products ("Korting op Alpro"), like the app's cards on
 * the promotions page. Opens the group's products.
 */
export function PromotionGroupCard({ group }: { group: PromotionGroupCardData }) {
  return (
    <Link
      href={`/promotions/${encodeURIComponent(group.id)}`}
      className="border-card-border bg-card-bg flex flex-col gap-1 rounded-xl border p-3 shadow-sm transition-colors hover:bg-gray-50"
    >
      <span className="text-foreground text-sm font-semibold">{group.name}</span>
      {group.example && <span className="text-xs text-gray-500">{group.example}</span>}
      {group.label && (
        <span className="mt-1">
          <Badge badge={{ text: group.label, variant: "promo" }} />
        </span>
      )}
    </Link>
  );
}
