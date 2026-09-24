import Link from "next/link";

import { ChevronRightIcon } from "@/components/layout/nav-icons";
import type { WalletBalance } from "@/lib/core/wallet-types";

/**
 * The Picnic-tegoed card, as on the app's Portemonnee pages: label, amount
 * and the colored explanation. Links to the balance page when `href` is set.
 */
export function BalanceCard({ balance, href }: { balance: WalletBalance; href?: string }) {
  const content = (
    <>
      <p className="font-semibold text-[#5b534e]">{balance.label}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-foreground text-4xl font-semibold">{balance.amount}</p>
        {href && <ChevronRightIcon className="h-6 w-6 text-[#c9c6c3]" />}
      </div>
      {balance.info.length > 0 && (
        <p className="mt-3 text-sm">
          {balance.info.map((part, index) => (
            <span
              key={index}
              className={index === 0 ? "font-medium" : ""}
              style={{ color: part.color ?? undefined }}
            >
              {index > 0 && " "}
              {part.text}
            </span>
          ))}
        </p>
      )}
    </>
  );

  const className = "block rounded-xl bg-[#f8f5f2] px-4 py-4";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:bg-[#f1ece7]`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
