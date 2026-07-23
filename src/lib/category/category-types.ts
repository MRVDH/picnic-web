/** A single browsable product category. */
export type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};

/** A quick-access shortcut tile from the "Snel naar" section. */
export type ShortcutItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
  badge: string | null;
};

/** Response shape for GET /api/categories. */
export type CategoriesApiResponse = {
  categories: CategoryItem[];
  shortcuts: ShortcutItem[];
};

/** Response shape for GET /api/categories/[categoryId]/subcategories. */
export type SubcategoriesApiResponse = {
  title: string;
  subcategories: CategoryItem[];
};
