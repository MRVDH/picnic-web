import { asNumber, asString, isObject } from "@/lib/core/type-guards";
import type { ProfileData, ProfileMenuItem } from "@/lib/core/user-types";
import type { RscNode, RscPageModel } from "@/lib/rsc/rsc-page-types";

const USER_INFO_COMPONENT = "user-info";
const MENU_LIST_COMPONENT = "menu-list";

/**
 * Parse the profile-root page (served as RSC) into the profile summary and
 * account menu. The page has a `user-info` component with the user and a
 * `menu-list` with the menu entries as `{ id, deeplink }`, in app order.
 */
export function parseProfilePage(page: RscPageModel): ProfileData {
  const user = findNode(page.nodes, USER_INFO_COMPONENT)?.props["user"];
  const items = findNode(page.nodes, MENU_LIST_COMPONENT)?.props["items"];

  const userData = isObject(user) ? user : null;
  const address =
    userData && isObject(userData["preferredAddress"]) ? userData["preferredAddress"] : null;

  const street = asString(address?.["street"]);
  const houseNumber = asNumber(address?.["houseNumber"]);
  const houseNumberExt = asString(address?.["houseNumberExtension"]);
  const addressLine = street
    ? [street, houseNumber > 0 ? `${houseNumber}${houseNumberExt}` : ""].filter(Boolean).join(" ")
    : "";

  const menu: ProfileMenuItem[] = (Array.isArray(items) ? items : []).flatMap((item) => {
    if (!isObject(item) || !asString(item["id"])) return [];
    return [{ id: asString(item["id"]), deepLink: asString(item["deeplink"]) || null }];
  });

  return {
    // The app shows first and last name as-is, e.g. "Maarten & Lisa ."
    name: [asString(userData?.["firstName"]), asString(userData?.["lastName"])]
      .filter(Boolean)
      .join(" ")
      .trim(),
    addressLine,
    avatarUrl: asString(userData?.["avatarUrl"]) || null,
    hasMembership: userData?.["hasMembership"] === true,
    menu,
  };
}

function findNode(nodes: RscNode[], component: string): RscNode | null {
  for (const node of nodes) {
    if (node.component === component) return node;
    const found = findNode(node.children, component);
    if (found) return found;
  }
  return null;
}
