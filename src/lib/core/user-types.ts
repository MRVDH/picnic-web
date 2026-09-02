/** Profile summary shown in the account panel header. */
export type ProfileData = {
  name: string;
  /** Street and house number, e.g. "Dorpsstraat 1". Empty when unknown. */
  addressLine: string;
  avatarUrl: string | null;
};

export type ProfileApiResponse = ProfileData;
