// The account menu: which entries Picnic lists (and in which order) comes
// from profile-root; labels and web routes are ours, keyed by the entry id.
import type { Translations } from "@/lib/core/i18n";
import type { ProfileMenuItem } from "@/lib/core/user-types";

/** Entries that have a web page. Everything else is shown as "coming soon". */
const WEB_ROUTES: Record<string, string> = {
  orders: "/deliveries",
  wallet: "/wallet",
  mgm: "/invite-friends",
  reminder: "/reminder",
  parcels: "/parcels",
};

/**
 * The app's menu order, used while the profile is loading or when it fails,
 * so the panel is usable without it.
 */
const FALLBACK_MENU_IDS = [
  "membershipExisting",
  "loyaltyPrograms",
  "orders",
  "wallet",
  "mgm",
  "parcels",
  "reminder",
  "contact",
  "faq",
];

export type AccountMenuEntry = {
  id: string;
  label: string;
  /** Web route, or null when the page isn't on the web yet. */
  href: string | null;
};

/** Labels per Picnic menu id; ids without a label are left out of the menu. */
function labelFor(id: string, t: Translations): string | null {
  switch (id) {
    case "membershipExisting":
      return t.accountFamilyAccount.replace("{highlight}", t.accountFamilyAccountHighlight);
    case "loyaltyPrograms":
      return t.accountLoyaltyPrograms;
    case "orders":
      return t.deliveriesNavLabel;
    case "wallet":
      return t.accountWallet;
    case "mgm":
      return t.accountFriends;
    case "parcels":
      return t.accountParcels;
    case "reminder":
      return t.accountReminders;
    case "contact":
      return t.accountSupport;
    case "faq":
      return t.accountFaq;
    default:
      return null;
  }
}

/** Build the menu from Picnic's entries, or the fallback order when there are none. */
export function buildAccountMenu(
  items: ProfileMenuItem[] | null,
  t: Translations
): AccountMenuEntry[] {
  const ids = items && items.length > 0 ? items.map((item) => item.id) : FALLBACK_MENU_IDS;

  return ids.flatMap((id) => {
    const label = labelFor(id, t);
    return label ? [{ id, label, href: WEB_ROUTES[id] ?? null }] : [];
  });
}
