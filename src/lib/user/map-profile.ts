import type PicnicClient from "picnic-api";

import type { ProfileData } from "@/lib/core/user-types";

type Profile = PicnicClient.Types.user.Profile;

/** Format picnic-api's profile for the account panel. */
export function mapProfile(profile: Profile): ProfileData {
  const address = profile.address;
  const houseNumber =
    address?.houseNumber && address.houseNumber > 0
      ? `${address.houseNumber}${address.houseNumberExtension ?? ""}`
      : "";
  const addressLine = address?.street
    ? [address.street, houseNumber].filter(Boolean).join(" ")
    : "";

  return {
    // The app shows first and last name as-is, e.g. "Jan & Anna ."
    name: [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim(),
    addressLine,
    avatarUrl: profile.avatarUrl,
    hasMembership: profile.hasMembership,
    menu: profile.menu.map((entry) => ({ id: entry.id, deepLink: entry.deeplink })),
  };
}
