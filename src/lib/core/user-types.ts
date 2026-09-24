/** One entry of the account menu, in the order the app shows it. */
export type ProfileMenuItem = {
  /** Picnic's id for the entry, e.g. "orders" or "parcels". Labels are ours, keyed by this id. */
  id: string;
  /** The app deep link the entry opens. */
  deepLink: string | null;
};

/** Profile summary and account menu shown in the account panel. */
export type ProfileData = {
  name: string;
  /** Street and house number, e.g. "Dorpsstraat 1". Empty when unknown. */
  addressLine: string;
  avatarUrl: string | null;
  /** Whether the user has a Family membership (shown as a badge on the avatar). */
  hasMembership: boolean;
  menu: ProfileMenuItem[];
};

export type ProfileApiResponse = ProfileData;

/** The user's Vriendenkorting (member-get-member) code, from /profile-menu. */
export type ReferralData = {
  /** e.g. "MAAR3267". */
  code: string;
  /** What the friend gets on their first order, in cents. */
  inviteeValue: number;
  /** What the user gets per friend, in cents. */
  inviterValue: number;
  /** Link the app shares, e.g. "https://picnic.app/nl/vriendenkorting/MAAR3267". */
  shareUrl: string | null;
};

export type ReferralApiResponse = ReferralData;

/** Weekdays as Picnic sends them, Monday first like the app shows them. */
export const REMINDER_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type ReminderDay = (typeof REMINDER_DAYS)[number];

/** The Boodschappenwekker: the days it rings and the one time they share. */
export type GroceryReminderData = {
  /** Selected days in app order; empty when no reminder is set. */
  days: ReminderDay[];
  /** "HH:MM"; the app's default 20:00 when no reminder is set. */
  time: string;
};

export type GroceryReminderApiResponse = GroceryReminderData;
