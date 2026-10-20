// Maps picnic-api's product details to the web's ProductDetail, which the product page renders.
import type PicnicClient from "picnic-api";

import type { ProductDetail } from "@/lib/core/types";

type ProductDetails = PicnicClient.Types.catalog.ProductDetails;

export function mapProductDetails(product: ProductDetails): ProductDetail {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? "",
    quantityBadges: product.quantityBadges,
    unitQuantity: product.unitQuantity,
    unitPrice: product.unitPrice,
    tags: product.tags,
    displayPrice: product.displayPrice,
    originalPrice: product.originalPrice,
    displayPriceColor: product.displayPriceColor,
    maxCount: product.maxCount,
    imageIds: product.imageIds,
    // The price section shows the promotion, so the labels leave it out.
    labels: product.labels.filter((label) => label.text !== product.promotion?.label),
    description: product.description,
    highlights: product.highlightItems,
    allergens: {
      confirmed: product.allergenGroups.contains,
      mayContain: product.allergenGroups.mayContain,
    },
    infoSections: product.infoSections,
    promotion: product.promotion,
    bundles: (product.priceRanges ?? []).map((tier) => ({
      id: product.id,
      quantity: tier.from_quantity,
      pricePerUnit: tier.price,
      imageId: product.imageIds[0] ?? "",
      maxCount: product.maxCount,
    })),
    similarProducts: product.similarProducts.map((similar) => ({
      id: similar.id,
      name: similar.name,
      imageId: similar.imageId,
      displayPrice: similar.displayPrice,
      unitQuantity: similar.unitQuantity,
      maxCount: similar.maxCount,
      ...(similar.deposit !== undefined ? { deposit: similar.deposit } : {}),
    })),
    nutritionRows: product.nutritionRows,
  };
}
