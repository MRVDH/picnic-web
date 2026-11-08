// The recipe-cattree-* pages Picnic DE served the cookbook categories from before the cookbook
// home linked to meals-category-page. Those pages stop at 500 recipes (Blitzrezepte has 1211); these
// list every recipe. Keyed by the name the cookbook home shows, so a category Picnic renames or
// adds falls back to its meals-category-page.
const DE_RECIPE_CATTREE_PAGES: Record<string, string> = {
  Blitzrezepte: "recipe-cattree-25min",
  "One Pot": "recipe-cattree-onepot",
  Pasta: "recipe-cattree-pasta",
  "Gefüllte Pasta": "recipe-cattree-stuffedpasta",
  Lasagne: "recipe-cattree-lasagne",
  Gnocchi: "recipe-cattree-gnocchi",
  Nudeln: "recipe-cattree-noodles",
  Schupfnudeln: "recipe-cattree-schupfnudeln",
  Maultaschen: "recipe-cattree-maultaschen",
  Spätzle: "recipe-cattree-spaetzle",
  "Asia & Reis": "recipe-cattree-asia-reis",
  Risotto: "recipe-cattree-risotto",
  Couscous: "recipe-cattree-couscous",
  Bulgur: "recipe-cattree-bulgur",
  Knödel: "recipe-cattree-knoedel",
  Kartoffel: "recipe-cattree-kartoffel",
  Suppen: "recipe-cattree-suppen",
  Eintopf: "recipe-cattree-eintopf",
  Curry: "recipe-cattree-curry2",
  Bowls: "recipe-cattree-bowls",
  Wraps: "recipe-cattree-wraps",
  Pita: "recipe-cattree-pita2",
  Quiche: "recipe-cattree-quiche",
  Traybake: "recipe-cattree-traybake",
  Aufläufe: "recipe-cattree-auflaufe",
  Vegetarisch: "recipe-cattree-vegetarisch",
  Vegan: "recipe-cattree-vegan",
  "Viel Gemüse": "recipe-cattree-highinveg",
  Brunch: "recipe-cattree-brunch",
  Aperitif: "recipe-cattree-aperitif",
  Dessert: "recipe-cattree-dessert",
  Abendbrot: "recipe-cattree-abendbrot",
  BBQ: "recipe-cattree-bbq",
  Basics: "recipe-cattree-basic",
  Backen: "recipe-cattree-baking",
  Snacks: "recipe-cattree-snacks",
  Getränke: "recipe-cattree-getraenke",
  Airfryer: "recipe-cattree-airfryer",
  Budget: "recipe-cattree-budget",
  "Jamie Oliver": "recipe-cattree-jamieoliver",
  Saisonal: "recipe-cattree-season",
};

/** The recipe-cattree page for a DE category or group name, or null. */
export function findRecipeCattreePage(name: string): string | null {
  const key = name.trim();
  return Object.hasOwn(DE_RECIPE_CATTREE_PAGES, key) ? DE_RECIPE_CATTREE_PAGES[key] : null;
}
