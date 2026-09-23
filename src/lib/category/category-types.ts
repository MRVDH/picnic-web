/** A single browsable product category. */
export type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};

/** Response shape for GET /api/categories/[categoryId]/subcategories. */
export type SubcategoriesApiResponse = {
  title: string;
  subcategories: CategoryItem[];
};
