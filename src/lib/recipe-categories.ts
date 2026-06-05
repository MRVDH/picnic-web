import type { CountryCode, RecipeCategory } from "./types";

const DE_CATEGORIES: RecipeCategory[] = [
  { id: "recipe-cattree-25min", name: "Blitzrezepte" },
  { id: "recipe-cattree-onepot", name: "One Pot" },
  { id: "recipe-cattree-pasta", name: "Pasta" },
  { id: "recipe-cattree-stuffedpasta", name: "Gefüllte Pasta" },
  { id: "recipe-cattree-lasagne", name: "Lasagne" },
  { id: "recipe-cattree-gnocchi", name: "Gnocchi" },
  { id: "recipe-cattree-noodles", name: "Nudeln" },
  { id: "recipe-cattree-schupfnudeln", name: "Schupfnudeln" },
  { id: "recipe-cattree-maultaschen", name: "Maultaschen" },
  { id: "recipe-cattree-spaetzle", name: "Spätzle" },
  { id: "recipe-cattree-asia-reis", name: "Asia & Reis" },
  { id: "recipe-cattree-risotto", name: "Risotto" },
  { id: "recipe-cattree-couscous", name: "Couscous" },
  { id: "recipe-cattree-bulgur", name: "Bulgur" },
  { id: "recipe-cattree-knoedel", name: "Knödel" },
  { id: "recipe-cattree-kartoffel", name: "Kartoffel" },
  { id: "recipe-cattree-suppen", name: "Suppen" },
  { id: "recipe-cattree-eintopf", name: "Eintopf" },
  { id: "recipe-cattree-curry2", name: "Curry" },
  { id: "recipe-cattree-l2-salad", name: "Salate" },
  { id: "recipe-cattree-bowls", name: "Bowls" },
  { id: "recipe-cattree-wraps", name: "Wraps" },
  { id: "recipe-cattree-pita2", name: "Pita" },
  { id: "recipe-cattree-l2-burger", name: "Burger" },
  { id: "recipe-cattree-quiche", name: "Quiche" },
  { id: "recipe-cattree-traybake", name: "Traybake" },
  { id: "recipe-cattree-auflaufe", name: "Aufläufe" },
  { id: "recipe-cattree-l2-pizza", name: "Pizza" },
  { id: "recipe-cattree-vegetarisch", name: "Vegetarisch" },
  { id: "recipe-cattree-vegan", name: "Vegan" },
  { id: "recipe-cattree-highinveg", name: "Viel Gemüse" },
  { id: "recipe-cattree-brunch", name: "Brunch" },
  { id: "recipe-cattree-aperitif", name: "Aperitif" },
  { id: "recipe-cattree-dessert", name: "Dessert" },
  { id: "recipe-cattree-abendbrot", name: "Abendbrot" },
  { id: "recipe-cattree-bbq", name: "BBQ" },
  { id: "recipe-cattree-l2-party", name: "Party" },
  { id: "recipe-cattree-basic", name: "Basics" },
  { id: "recipe-cattree-baking", name: "Backen" },
  { id: "recipe-cattree-snacks", name: "Snacks" },
  { id: "recipe-cattree-getraenke", name: "Getränke" },
  { id: "recipe-cattree-airfryer", name: "Airfryer" },
  { id: "recipe-cattree-budget", name: "Budget" },
  { id: "recipe-cattree-jamieoliver", name: "Jamie Oliver" },
  { id: "recipe-cattree-season", name: "Saisonal" },
  { id: "recipe-cattree-l2-kids", name: "Für Kinder" },
];

// NL uses UUID-based category pages. The id is the full Picnic API page path
// passed to client.app.getPage(). Note: "meals-category-page" is a shell that
// defers content via a SUSPENSE block; the actual recipes live in
// "meals-category-page-content?category_id=<uuid>", which is what we call directly.
const NL_CATEGORIES: RecipeCategory[] = [
  {
    id: "meals-category-page-content?category_id=c24af7dc-f056-4067-8953-6a8f85410bf8",
    name: "Onder de 20 minuten",
  },
  {
    id: "meals-category-page-content?category_id=8efb8aab-c728-4df0-a427-ef3e18727dd1",
    name: "Weinig snijwerk",
  },
  {
    id: "meals-category-page-content?category_id=0524acc5-8f37-4f2e-b85a-d58b6f24b528",
    name: "Eenpansgerechten",
  },
  {
    id: "meals-category-page-content?category_id=ba089fa4-23c1-4361-b5a1-b24be2e013b6",
    name: "Pasta",
  },
  {
    id: "meals-category-page-content?category_id=d420d519-0c36-4109-86a8-e46cb5723f6e",
    name: "Ravioli & tortellini",
  },
  {
    id: "meals-category-page-content?category_id=9f238cf6-355d-4c96-bd66-36a1bed2ca4e",
    name: "Lasagne",
  },
  {
    id: "meals-category-page-content?category_id=14a589b9-57d8-4c36-bbea-2e095879cafa",
    name: "Noedels",
  },
  {
    id: "meals-category-page-content?category_id=8c6641c8-3b40-4d02-ae1c-cffc74533403",
    name: "Rijst",
  },
  {
    id: "meals-category-page-content?category_id=3bc87ef2-97ae-4ced-a67d-ba1db99e835c",
    name: "Risotto",
  },
  {
    id: "meals-category-page-content?category_id=aaf728c0-faf4-4d2b-81be-381cf0bbf81f",
    name: "Couscous, bulgur & quinoa",
  },
  {
    id: "meals-category-page-content?category_id=32e341cb-b9dd-4fd7-bbb4-a374a279f973",
    name: "Stamppot",
  },
  {
    id: "meals-category-page-content?category_id=745a4764-9670-4973-aa56-435ab4eca1ec",
    name: "Aardappelen",
  },
  {
    id: "meals-category-page-content?category_id=b29cbecb-6ddf-4ee0-a35e-d069ffd3c157",
    name: "Wraps & taco's",
  },
  {
    id: "meals-category-page-content?category_id=88f94486-b6d3-46f5-860e-0a1e1067f31d",
    name: "Pita & platbrood",
  },
  {
    id: "meals-category-page-content?category_id=16ee3d05-7e6a-40bc-b00a-1825514e51cf",
    name: "Pizza",
  },
  {
    id: "meals-category-page-content?category_id=5989ff24-36c9-43b3-83b1-57676ea2ca6c",
    name: "Burgers",
  },
  {
    id: "meals-category-page-content?category_id=2701028e-a90c-4198-ad91-a2f66e201b1b",
    name: "Ovenschotels",
  },
  {
    id: "meals-category-page-content?category_id=a5401880-0ad7-458b-aa5f-eac84da20865",
    name: "Traybakes",
  },
  {
    id: "meals-category-page-content?category_id=77eca1e7-1f83-43ad-a184-25da3532f065",
    name: "Plaattaart & flammkuchen",
  },
  {
    id: "meals-category-page-content?category_id=95512d80-583a-4d7b-907c-6899dd08d941",
    name: "Quiche",
  },
  {
    id: "meals-category-page-content?category_id=fcf06318-8f10-494b-8655-d283b3fbad18",
    name: "Airfryer",
  },
  {
    id: "meals-category-page-content?category_id=392d64fb-9452-4b24-9d82-36eda598382a",
    name: "Soep",
  },
  {
    id: "meals-category-page-content?category_id=5c45153e-c5aa-4402-b186-0ae09ee69fc5",
    name: "Vega",
  },
  {
    id: "meals-category-page-content?category_id=c6c05c56-49e6-4121-8803-ec3845384d36",
    name: "Vegan",
  },
  {
    id: "meals-category-page-content?category_id=60ac9475-3d4c-49c0-bf72-65cfecdfcfec",
    name: "Veel groente",
  },
  {
    id: "meals-category-page-content?category_id=5ef7b94b-15ba-4428-964b-181ee15feb0c",
    name: "Koolhydraatarm",
  },
  {
    id: "meals-category-page-content?category_id=c771f79e-65c7-4c25-873f-f45d738b2d4f",
    name: "Caloriearm",
  },
  {
    id: "meals-category-page-content?category_id=e0842ef6-770b-4324-ba51-eb8ca5368c38",
    name: "Zwangerproof",
  },
  {
    id: "meals-category-page-content?category_id=a8ce9cb8-61ba-44ab-bb7a-429e835659af",
    name: "Ontbijt",
  },
  {
    id: "meals-category-page-content?category_id=16c7d514-9f19-4568-b673-4513db894215",
    name: "Brunch & lunch",
  },
  {
    id: "meals-category-page-content?category_id=c92f50ef-2704-4585-9a50-40778a25ddef",
    name: "Drankjes",
  },
  {
    id: "meals-category-page-content?category_id=13bd904b-b39b-470b-aa71-3c91a9f3d1cc",
    name: "BBQ",
  },
  {
    id: "meals-category-page-content?category_id=bea9f93c-35e4-46f1-8ab4-19943074268a",
    name: "Budget",
  },
  {
    id: "meals-category-page-content?category_id=98733940-cdfe-4009-951a-89878911763e",
    name: "Koken met het seizoen",
  },
  {
    id: "meals-category-page-content?category_id=fc6a8ef1-8410-4f20-8137-332ddc8bb749",
    name: "Basisrecepten",
  },
  {
    id: "meals-category-page-content?category_id=33fa5851-be5d-40ba-92a4-35a382cbe9b8",
    name: "Verspakketten",
  },
  {
    id: "meals-category-page-content?category_id=3aa8ebe4-d0b5-4cad-b638-dcbd1d3ab8c4",
    name: "Jamie Oliver",
  },
  {
    id: "meals-category-page-content?category_id=f54dd9a3-9009-4832-b326-ecda25cd8834",
    name: "Eef Kookt Zo",
  },
  {
    id: "meals-category-page-content?category_id=f4b5b9e4-bb06-4078-a44f-2814b0c12030",
    name: "24Kitchen",
  },
];

export function getRecipeCategories(countryCode: CountryCode): RecipeCategory[] {
  if (countryCode === "DE") return DE_CATEGORIES;
  if (countryCode === "NL") return NL_CATEGORIES;
  return [];
}
