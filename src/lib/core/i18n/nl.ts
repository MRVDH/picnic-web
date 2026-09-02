/**
 * Dutch (Netherlands) UI strings.
 *
 * This is the reference language: its keys define the {@link Translations}
 * shape every other language file is checked against.
 */
export const nl = {
  // Search bar
  searchPlaceholder: "Zoek producten...",
  searchAriaLabel: "Zoek producten",
  searchButtonAriaLabel: "Zoeken",

  // Home page errors
  searchError: "Er is iets misgegaan. Probeer het later opnieuw.",
  categoriesLoadError: "Kan categorieën niet laden.",

  // Results view
  noResultsFor: "Geen resultaten gevonden voor",
  tryAnotherTerm: "Probeer een andere zoekterm",
  resultSingular: "resultaat",
  resultPlural: "resultaten",

  // Login page
  loginTitle: "Inloggen",
  sessionExpired: "Je sessie is verlopen. Log opnieuw in.",
  enter2FACode: "Voer de verificatiecode in",
  verificationFailed: "Verificatie mislukt. Probeer het later opnieuw.",
  enterEmailAndPassword: "Vul je e-mailadres en wachtwoord in",
  loginFailed: "Inloggen mislukt. Probeer het later opnieuw.",
  enterToken: "Voer een token in",
  tokenVerifyFailed: "Kan token niet verifiëren. Probeer het later opnieuw.",
  smsSent: "Er is een verificatiecode naar je telefoon gestuurd via SMS.",
  verificationCodeLabel: "Verificatiecode",
  verificationCodePlaceholder: "Voer de code in",
  emailLabel: "E-mailadres",
  emailPlaceholder: "je-email@voorbeeld.nl",
  passwordLabel: "Wachtwoord",
  passwordPlaceholder: "Je wachtwoord",
  tokenPlaceholder: "Plak je token hier",
  hideToken: "Token verbergen",
  showToken: "Token tonen",
  verifyButton: "Verifiëren",
  loginButton: "Inloggen",
  howToGetToken: "Hoe krijg ik een auth token?",
  npmPackageUseBefore: "Gebruik de",
  npmPackageText: "npm package om in te loggen met je Picnic account:",
  copyAuthKeyBefore: "Kopieer de",
  copyAuthKeyAfter: "waarde en plak deze hierboven in.",
  whyAuthToken: "Waarom heb ik een auth token nodig?",
  whyAuthTokenBody:
    "Om veiligheidsredenen tonen we geen standaard inlogformulier met e-mailadres en wachtwoord. Een auth token zorgt ervoor dat je inloggegevens nooit via deze website worden verstuurd. Het token kan op elk moment worden ingetrokken zonder je wachtwoord te wijzigen.",
  isOfficialSite: "Is dit de officiële Picnic website?",
  isOfficialSiteBody:
    "Nee, dit is niet de officiële Picnic website. Dit is een onafhankelijk open-source project en is op geen enkele manier verbonden aan Picnic. Bekijk de broncode op",
  tokenInvalid: "Token is ongeldig. Probeer opnieuw.",
  credentialsInvalid: "E-mailadres of wachtwoord is onjuist. Probeer opnieuw.",
  twoFAInvalid: "Verificatiecode is onjuist. Probeer opnieuw.",
  apiUnreachable: "Kan niet verbinden met Picnic. Probeer het later opnieuw.",
  genericError: "Er is iets misgegaan. Probeer het later opnieuw.",
  loadingAriaLabel: "Laden",
  codeSnippetEmail: "je-email",
  codeSnippetPassword: "je-wachtwoord",

  // Cart
  emptyCartTitle: "Je winkelwagen is leeg",
  emptyCartText: "Voeg producten toe via de Picnic app of zoek iets op.",
  goToSearch: "Naar zoeken",
  cartTitle: "Winkelwagen",
  nothingForgotten: "Niets vergeten?",
  cartMutationError: "Er ging iets mis. Probeer het opnieuw.",
  cartLoadError: "Er is iets misgegaan. Probeer het later opnieuw.",
  cartOtherItems: "Overige producten",
  clearCartButton: "Winkelwagen leegmaken",
  clearCartError: "Kan winkelwagen niet leegmaken. Probeer het opnieuw.",
  clearCartConfirmTitle: "Winkelwagen leegmaken?",
  clearCartConfirmMessage: "Alle producten worden verwijderd uit je winkelwagen.",
  confirmButton: "Bevestigen",
  cancelButton: "Annuleren",

  // Checkout
  checkoutLabel: "Naar de kassa",
  checkoutDeepLinkCountry: "nl",
  checkoutPageTitle: "Afrekenen",
  checkoutLoadError: "Kon checkout niet laden.",
  checkoutContinueButton: "Doorgaan naar betaling",
  checkoutProcessing: "Bezig…",
  checkoutStartError: "Kon checkout niet starten.",
  checkoutPaymentError: "Kon betaling niet starten.",
  checkoutPaymentTitle: "Betaalgegevens",
  checkoutOrderTotal: "Totaal",
  checkoutExpires: "Geldig tot",
  checkoutPayButton: "Naar de bank",
  checkoutReturnTitle: "Betaling afronden",
  checkoutMissingSession: "Geen actieve betalingssessie gevonden.",
  checkoutPollingMessage: "We controleren je betaling…",
  checkoutStatusLabel: "Status",
  checkoutCancelPaymentButton: "Betaling annuleren",
  checkoutStatusError: "Kon betalingsstatus niet ophalen.",
  checkoutConfirmError: "Kon bestelling niet bevestigen.",
  checkoutCancelError: "Kon betaling niet annuleren.",
  checkoutMinimumNotMet: "Minimale bestelwaarde nog niet bereikt.",

  // Delivery slot picker
  pickerTitle: "Kies je bezorgmoment",
  freeDeliveryLabel: "Altijd gratis bezorgd!",
  selectedSectionLabel: "Geselecteerd door jou",
  otherMomentLabel: "Of kies een ander moment",
  greenChoiceLabel: "Groenste keuze voor jouw buurt",
  noSlotsLabel: "Geen bezorgmomenten beschikbaar.",
  closeAriaLabel: "Sluiten",
  retryLabel: "Opnieuw proberen",
  tapToChoose: "Tik om te kiezen",

  // Order summary
  depositBag: "Statiegeld tasje",
  depositBottle: "Statiegeld fles",
  depositGeneric: "Statiegeld",
  orderSummaryTitle: "Besteloverzicht",
  itemsLabel: "Artikelen",
  discountLabel: "Korting",
  membershipSavingsLabel: "Picnic-lidmaatschapsbesparing",
  minimumOrderLabel: "Minimale bestelwaarde",
  totalLabel: "Totaal",

  // Quantity stepper
  removeOneAriaLabel: "Verwijder 1",
  addOneAriaLabel: "Voeg 1 toe",

  // Savings label
  savedSuffix: "bespaard",

  // Product card
  addToCartAriaLabel: "Toevoegen aan winkelwagen",
  addToCartButton: "In mandje",
  inCartLabel: "in mandje",
  bundleFromLabel: "Vanaf",
  similarProductsTitle: "Vergelijkbare producten",
  descriptionTitle: "Beschrijving",

  // Category grid
  allCategoriesTitle: "Alle categorieën",

  // Shortcut list
  shortcutSectionTitle: "Snel naar",

  // Section nav bar
  sectionNavGoTo: "Ga naar",

  // Category products view
  backButton: "Terug",
  noProductsInCategory: "Geen producten gevonden in deze categorie.",
  productSingular: "product",
  productPlural: "producten",

  // Pages
  defaultPageTitle: "Producten",
  noPageSpecified: "Geen pagina opgegeven.",
  productsLoadError: "Kan producten niet laden.",

  // Cookbook
  cookbookTitle: "Alle recepten",
  cookbookFeatured: "Uitgelicht",
  cookbookSaved: "Opgeslagen recepten",
  cookbookSearchPlaceholder: "Zoek op recept of ingrediënt...",
  cookbookLoadError: "Recepten konden niet worden geladen.",
  noRecipes: "Geen recepten gevonden.",
  cookingTimeMinutes: "min",
  cookbookCategoryLabel: "Categorie",
  recipeSave: "Recept opslaan",
  recipeUnsave: "Recept niet meer opslaan",
  recipeSaveError: "Recept kon niet worden opgeslagen.",
  mealPlanSelectAll: "Alles selecteren",
  mealPlanDays: "dagen",
  mealPlanGenerate: "Plan genereren",
  mealPlanRegenerate: "Opnieuw genereren",
  mealPlanSummary: "{n} recepten geselecteerd",

  // Auth
  signOut: "Uitloggen",

  // App navigation
  navMainAriaLabel: "Hoofdnavigatie",
  navDiscover: "Ontdek",
  navFavorites: "Favorieten",
  navCooking: "Koken",
  navSearch: "Zoeken",
  navCart: "Mandje",
  navAccount: "Account",
  closeLabel: "Sluiten",

  // Account panel
  accountParcels: "Pakketservice",
  accountWallet: "Portemonnee",
  accountFriends: "Vriendenkorting",
  accountReminders: "Boodschappenwekker",
  accountSupport: "Klantenservice",
  accountFaq: "Veelgestelde vragen",
  comingSoon: "Binnenkort",

  // Discover and favorites placeholders
  discoverTitle: "Ontdek",
  favoritesTitle: "Favorieten",

  // Recipe detail
  recipeIngredients: "Ingrediënten",
  recipeSteps: "Bereiding",
  recipePortions: "Personen",
  recipeAddToCart: "Alle ingrediënten toevoegen",
  recipeAddingToCart: "Wordt toegevoegd...",
  recipeAddedToCart: "Toegevoegd!",
  recipeCondiments: "Heb je waarschijnlijk al",
  recipeLoadError: "Recept kon niet worden geladen.",
  recipePricePerServing: "per portie",
  recipePriceTotal: "totaal",
  recipeAllergens: "Bevat",
  recipeMayContain: "Kan bevatten",
  recipeNutrition: "Voedingswaarde",

  // Toast / error view
  dismissAriaLabel: "Sluiten",
  retryButton: "Opnieuw proberen",

  // Generic error page
  errorHeading: "Er is iets misgegaan",
  errorUnexpected: "Een onverwachte fout is opgetreden.",
  errorRetry: "Probeer opnieuw",

  // Category page
  categoryFallbackTitle: "Categorie",
  subcategoriesLoadError: "Kan subcategorieën niet laden.",

  // Token login label
  authTokenLabel: "Picnic Auth-token",

  // Search results count
  resultFor: "voor",

  // Allergen badges
  allergenTitle: "Allergenen",

  // Deliveries
  deliveriesTitle: "Bestellingen",
  deliveriesNavLabel: "Bestellingen",
  deliveriesTabAll: "Alle",
  deliveriesEmptyAll: "Nog geen bestellingen.",
  deliveriesTabCurrent: "Actueel",
  deliveriesTabCompleted: "Afgerond",
  deliveriesTabCancelled: "Geannuleerd",
  deliveriesEmptyCurrent: "Geen actieve bestellingen.",
  deliveriesEmptyCompleted: "Geen afgeronde bestellingen.",
  deliveriesEmptyCancelled: "Geen geannuleerde bestellingen.",
  deliveriesLoadError: "Bestellingen konden niet worden geladen.",
  deliveriesLiveTrack: "Live volgen",
  deliveriesOrdersLabel: "bestellingen",
  deliveriesStatusCurrent: "Actief",
  deliveriesStatusCompleted: "Afgerond",
  deliveriesStatusCancelled: "Geannuleerd",
  deliveriesStatusPlanned: "Gepland",
  deliveriesStatusEnRoute: "Onderweg",
  deliveriesStatusDelivered: "Bezorgd",
  deliveriesDetailTitle: "Bestelling",
  deliveriesDetailLoadError: "Bestelling kon niet worden geladen.",
  deliveriesWindowTitle: "Bezorgmoment",
  deliveriesPaymentTitle: "Betaling",
  deliveriesPaymentType: "Betaalmethode",
  deliveriesReturnedContainers: "Teruggebracht statiegeld",
  deliveriesCancelButton: "Bestelling annuleren",
  deliveriesCancelConfirmTitle: "Bestelling annuleren?",
  deliveriesCancelConfirmMessage: "Weet je zeker dat je deze bestelling wilt annuleren?",
  deliveriesCancelSuccess: "Bestelling geannuleerd.",
  deliveriesCancelError: "Annuleren mislukt. Probeer het opnieuw.",
  deliveriesRateTitle: "Beoordeel je bezorging",
  deliveriesRateSubmit: "Beoordeling versturen",
  deliveriesRateSuccess: "Bedankt voor je beoordeling!",
  deliveriesRateError: "Beoordeling kon niet worden verstuurd.",
  deliveriesRateAlready: "Deze bestelling is al beoordeeld.",
  deliveriesInvoiceButton: "Factuur opnieuw versturen",
  deliveriesInvoiceSuccess: "Factuur is per e-mail verstuurd.",
  deliveriesInvoiceError: "Factuur kon niet worden verstuurd.",
  deliveriesParcelsTitle: "Pakketten",
  deliveriesParcelsSubtitle: "Geef je pakketjes gratis aan ons mee.",
  deliveriesParcelsActive: "Actief",
  deliveriesParcelsProcessed: "Verwerkt",
  deliveriesParcelName: "{carrier}-pakket",
  deliveriesParcelStatusHandedOver: "Opgehaald door Picnic",
  deliveriesParcelTrack: "Volgen",
  deliveriesTrackingDriver: "Bezorger",
  deliveriesTrackingEta: "Verwachte aankomst",
  deliveriesTrackingNoMap: "Live routekaart is nog niet beschikbaar.",
  deliveriesTrackingLoading: "Tracking laden...",
} as const;
