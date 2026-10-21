/** A subcategory, or the promotions of a category ("Acties"), as listed on a category page. */
export type CategoryItem = {
  /** The subcategory id, or `promotions-<categoryId>` for the promotions of the category. */
  id: string;
  name: string;
  imageId: string;
};

/** Response shape for GET /api/categories/[categoryId]/subcategories. */
export type SubcategoriesApiResponse = {
  title: string;
  subcategories: CategoryItem[];
};
