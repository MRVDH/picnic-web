// Maps the referral ("Vriendenkorting") of picnic-api's profile menu to the web's ReferralData.
import type PicnicClient from "picnic-api";

import type { ReferralData } from "@/lib/core/user-types";

type ProfileMenu = PicnicClient.Types.user.RawProfileMenu;

/** The referral of `user.getProfileMenu()`, or null when the account has no code. */
export function mapReferral(menu: ProfileMenu): ReferralData | null {
  const mgm = menu.user?.mgm;
  if (!mgm?.mgm_code) return null;

  return {
    code: mgm.mgm_code,
    inviteeValue: mgm.invitee_value,
    inviterValue: mgm.inviter_value,
    shareUrl: mgm.share_url || null,
  };
}
