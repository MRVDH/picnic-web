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
