import { asNumber, asString, isObject } from "@/lib/core/type-guards";
import type { ReferralData } from "@/lib/core/user-types";

/**
 * Parse the Vriendenkorting data from `/profile-menu?fetch_mgm=true`
 * (picnic-api `user.getProfileMenu`):
 * `{ user: { mgm: { mgm_code, invitee_value, inviter_value, share_url } } }`.
 * Returns null when the account has no code.
 */
export function parseReferral(rawData: unknown): ReferralData | null {
  const user = isObject(rawData) && isObject(rawData["user"]) ? rawData["user"] : null;
  const mgm = user && isObject(user["mgm"]) ? user["mgm"] : null;
  const code = asString(mgm?.["mgm_code"]);
  if (!code) return null;

  return {
    code,
    inviteeValue: asNumber(mgm?.["invitee_value"]),
    inviterValue: asNumber(mgm?.["inviter_value"]),
    shareUrl: asString(mgm?.["share_url"]) || null,
  };
}
