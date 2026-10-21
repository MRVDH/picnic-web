// Maps picnic-api's cart contents to the web's CartData, adding the display texts.
import type PicnicClient from "picnic-api";

import { getTranslations } from "@/lib/core/i18n";
import type { Badge, CartData, CartItem, CountryCode } from "@/lib/core/types";
import { formatBannerText } from "@/lib/delivery/format-delivery-window";

type CartContents = PicnicClient.Types.cart.CartContents;
type CartLineItem = PicnicClient.Types.cart.CartLineItem;

function mapBadges(line: CartLineItem): Badge[] {
  return [
    ...line.labels.map(
      (label): Badge => ({
        text: label.text,
        variant: label.text.toLowerCase().includes("bundel") ? "bundle" : "promo",
        backgroundColor: label.backgroundColor ?? undefined,
        textColor: label.textColor ?? undefined,
      })
    ),
    ...(line.freshness ? [{ text: line.freshness, variant: "freshness" as const }] : []),
    ...(line.basePrice ? [{ text: line.basePrice, variant: "unit-price" as const }] : []),
    ...(line.bundlesLink ? [{ text: "BundelBonus", variant: "bundle" as const }] : []),
  ];
}

function mapLine(line: CartLineItem): CartItem {
  return {
    id: line.id,
    productId: line.productId,
    name: line.name,
    unitQuantity: line.unitQuantity,
    imageId: line.imageId ?? "",
    displayPrice: line.displayPrice,
    originalPrice: line.originalPrice,
    quantity: line.quantity,
    maxCount: line.maxCount,
    badges: mapBadges(line),
    isUnavailable: line.isUnavailable,
    unavailableExplanation: line.unavailableReason,
    replacements: line.replacements.map((product) => ({
      id: product.id,
      name: product.name,
      imageId: product.imageId ?? "",
      displayPrice: product.displayPrice,
      unitQuantity: product.unitQuantity,
      maxCount: product.maxCount,
    })),
    basketGroupId: line.recipeId,
  };
}

export function mapCart(cart: CartContents, countryCode: CountryCode): CartData {
  // Unavailable lines go to the bottom, keeping their order.
  const items = cart.items
    .map(mapLine)
    .sort((a, b) => Number(a.isUnavailable) - Number(b.isUnavailable));
  const slot = cart.selectedSlot;
  const deliveryBannerText =
    (slot?.isExplicitSelection
      ? formatBannerText(slot.windowStart, slot.windowEnd, countryCode)
      : null) ?? getTranslations(countryCode).pickerTitle;

  return {
    items,
    totalPrice: cart.totalPrice,
    totalCount: cart.totalCount,
    totalDiscount: cart.discount,
    depositTotal: cart.depositTotal,
    depositBreakdown: cart.deposits,
    membershipSavings: cart.membershipSavings,
    promoSavings: cart.promotionSavings,
    fees: cart.fees,
    minimumOrderValue: cart.minimumOrderValue,
    selectedSlot: slot,
    deliveryBannerText,
    recipeGroups: cart.recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      imageId: recipe.imageId,
    })),
  };
}
