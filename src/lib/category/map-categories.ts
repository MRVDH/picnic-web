// Maps picnic-api's category lists to the web's category pages.
import type PicnicClient from "picnic-api";

import type { CategoryItem } from "@/lib/category/category-types";

type Subcategories = PicnicClient.Types.catalog.Subcategories;

/** The id prefix of the promotions entry ("Acties") on a category page. */
export const PROMOTIONS_PREFIX = "promotions-";

/** The subcategories and the promotions entry, in the order of the page. Other links are left out. */
export function mapSubcategories(subcategories: Subcategories): CategoryItem[] {
  return subcategories.links.flatMap((link): CategoryItem[] => {
    const imageId = link.imageId ?? "";
    if (link.target.type === "products")
      return [{ id: link.target.categoryId, name: link.name, imageId }];
    if (link.target.type === "promotions") {
      return [{ id: `${PROMOTIONS_PREFIX}${link.target.categoryId}`, name: link.name, imageId }];
    }
    return [];
  });
}
