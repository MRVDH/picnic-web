/** A single browsable product category. */
export type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};

/**
 * A label shown under a shortcut title (e.g. "1300+ producten").
 * Colors are CSS color strings taken from the PML, or null when the page
 * didn't provide one.
 */
export type ShortcutBadge = {
  text: string;
  backgroundColor: string | null;
  textColor: string | null;
};

/**
 * One piece of a shortcut title, in display order. "Onze Versmarkt" is
 * "Onze", a laurel icon, a gold "Versmarkt" and another laurel icon.
 * Colors are CSS colors, or null for the default text color.
 */
export type ShortcutTitlePart =
  | { type: "text"; text: string; color: string | null }
  | { type: "icon"; iconKey: string; color: string | null; width: number; height: number };

/** A quick-access shortcut row shown above the categories on the search page. */
export type ShortcutItem = {
  id: string;
  /** Plain-text title, used for alt text and page titles. */
  name: string;
  titleParts: ShortcutTitlePart[];
  imageId: string;
  deepLinkTarget: string;
  badge: ShortcutBadge | null;
};

/** Response shape for GET /api/categories. */
export type CategoriesApiResponse = {
  categories: CategoryItem[];
  /** Heading above the categories as provided by Picnic, e.g. "Alle categorieën". */
  categoriesTitle: string | null;
  shortcuts: ShortcutItem[];
};

/** Response shape for GET /api/categories/[categoryId]/subcategories. */
export type SubcategoriesApiResponse = {
  title: string;
  subcategories: CategoryItem[];
};
