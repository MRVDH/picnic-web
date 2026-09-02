import { asNumber, asString, isObject } from "@/lib/core/type-guards";
import type { ProfileData } from "@/lib/core/user-types";

/**
 * Parse the `/profile-menu` response into the profile summary.
 *
 * Raw shape (picnic-api `ProfileMenu`):
 * `{ user: { name, address: { street, house_number, house_number_ext }, avatar: { image_url } } }`.
 */
export function parseProfile(rawData: unknown): ProfileData {
  const user = isObject(rawData) && isObject(rawData["user"]) ? rawData["user"] : null;
  const address = user && isObject(user["address"]) ? user["address"] : null;
  const avatar = user && isObject(user["avatar"]) ? user["avatar"] : null;

  const street = asString(address?.["street"]);
  const houseNumber = asNumber(address?.["house_number"]);
  const houseNumberExt = asString(address?.["house_number_ext"]);
  const addressLine = street
    ? [street, houseNumber > 0 ? `${houseNumber}${houseNumberExt}` : ""].filter(Boolean).join(" ")
    : "";

  return {
    name: asString(user?.["name"]).trim(),
    addressLine,
    avatarUrl: asString(avatar?.["image_url"]) || null,
  };
}
