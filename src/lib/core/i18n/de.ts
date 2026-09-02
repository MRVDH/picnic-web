import type { Translations } from "@/lib/core/i18n/types";

/** German (Germany) UI strings. */
export const de = {
  // Search bar
  searchPlaceholder: "Produkte suchen...",
  searchAriaLabel: "Produkte suchen",
  searchButtonAriaLabel: "Suchen",

  // Home page errors
  searchError: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
  categoriesLoadError: "Kategorien konnten nicht geladen werden.",

  // Results view
  noResultsFor: "Keine Ergebnisse gefunden für",
  tryAnotherTerm: "Versuche einen anderen Suchbegriff",
  resultSingular: "Ergebnis",
  resultPlural: "Ergebnisse",

  // Login page
  loginTitle: "Anmelden",
  sessionExpired: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
  enter2FACode: "Gib den Bestätigungscode ein",
  verificationFailed: "Verifizierung fehlgeschlagen. Bitte versuche es später erneut.",
  enterEmailAndPassword: "Gib deine E-Mail-Adresse und dein Passwort ein",
  loginFailed: "Anmeldung fehlgeschlagen. Bitte versuche es später erneut.",
  enterToken: "Gib ein Token ein",
  tokenVerifyFailed: "Token konnte nicht verifiziert werden. Bitte versuche es später erneut.",
  smsSent: "Ein Bestätigungscode wurde per SMS an dein Telefon gesendet.",
  verificationCodeLabel: "Bestätigungscode",
  verificationCodePlaceholder: "Code eingeben",
  emailLabel: "E-Mail-Adresse",
  emailPlaceholder: "deine-email@beispiel.de",
  passwordLabel: "Passwort",
  passwordPlaceholder: "Dein Passwort",
  tokenPlaceholder: "Token hier einfügen",
  hideToken: "Token verbergen",
  showToken: "Token anzeigen",
  verifyButton: "Verifizieren",
  loginButton: "Anmelden",
  howToGetToken: "Wie bekomme ich einen Auth-Token?",
  npmPackageUseBefore: "Nutze das",
  npmPackageText: "npm-Paket zum Anmelden bei deinem Picnic-Konto:",
  copyAuthKeyBefore: "Kopiere den",
  copyAuthKeyAfter: "Wert und füge ihn oben ein.",
  whyAuthToken: "Warum brauche ich einen Auth-Token?",
  whyAuthTokenBody:
    "Aus Sicherheitsgründen zeigen wir kein Standard-Anmeldeformular mit E-Mail-Adresse und Passwort. Ein Auth-Token stellt sicher, dass deine Anmeldedaten niemals über diese Website übertragen werden. Das Token kann jederzeit widerrufen werden, ohne dein Passwort zu ändern.",
  isOfficialSite: "Ist dies die offizielle Picnic-Website?",
  isOfficialSiteBody:
    "Nein, dies ist nicht die offizielle Picnic-Website. Dies ist ein unabhängiges Open-Source-Projekt und steht in keiner Verbindung zu Picnic. Sieh dir den Quellcode auf",
  tokenInvalid: "Token ist ungültig. Bitte versuche es erneut.",
  credentialsInvalid: "E-Mail-Adresse oder Passwort ist falsch. Bitte versuche es erneut.",
  twoFAInvalid: "Bestätigungscode ist falsch. Bitte versuche es erneut.",
  apiUnreachable: "Verbindung mit Picnic nicht möglich. Bitte versuche es später erneut.",
  genericError: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
  loadingAriaLabel: "Laden",
  codeSnippetEmail: "deine-email",
  codeSnippetPassword: "dein-passwort",

  // Cart
  emptyCartTitle: "Dein Warenkorb ist leer",
  emptyCartText: "Füge Produkte über die Picnic-App hinzu oder suche etwas.",
  goToSearch: "Zur Suche",
  cartTitle: "Warenkorb",
  nothingForgotten: "Alles dabei?",
  cartMutationError: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
  cartLoadError: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
  cartOtherItems: "Weitere Produkte",
  clearCartButton: "Warenkorb leeren",
  clearCartError: "Warenkorb konnte nicht geleert werden. Bitte versuche es erneut.",
  clearCartConfirmTitle: "Warenkorb leeren?",
  clearCartConfirmMessage: "Alle Produkte werden aus deinem Warenkorb entfernt.",
  confirmButton: "Bestätigen",
  cancelButton: "Abbrechen",

  // Checkout
  checkoutLabel: "Zur Kasse",
  checkoutDeepLinkCountry: "de",
  checkoutPageTitle: "Kasse",
  checkoutLoadError: "Checkout konnte nicht geladen werden.",
  checkoutContinueButton: "Weiter zur Zahlung",
  checkoutProcessing: "Wird verarbeitet…",
  checkoutStartError: "Checkout konnte nicht gestartet werden.",
  checkoutPaymentError: "Zahlung konnte nicht gestartet werden.",
  checkoutPaymentTitle: "Zahlungsdaten",
  checkoutOrderTotal: "Gesamt",
  checkoutExpires: "Gültig bis",
  checkoutPayButton: "Zur Bank",
  checkoutReturnTitle: "Zahlung abschließen",
  checkoutMissingSession: "Keine aktive Zahlungssitzung gefunden.",
  checkoutPollingMessage: "Wir prüfen deine Zahlung…",
  checkoutStatusLabel: "Status",
  checkoutCancelPaymentButton: "Zahlung abbrechen",
  checkoutStatusError: "Zahlungsstatus konnte nicht abgerufen werden.",
  checkoutConfirmError: "Bestellung konnte nicht bestätigt werden.",
  checkoutCancelError: "Zahlung konnte nicht abgebrochen werden.",
  checkoutMinimumNotMet: "Mindestbestellwert noch nicht erreicht.",

  // Delivery slot picker
  pickerTitle: "Wähle deinen Lieferzeitpunkt",
  freeDeliveryLabel: "Immer kostenlos geliefert!",
  selectedSectionLabel: "Von dir ausgewählt",
  otherMomentLabel: "Oder wähle einen anderen Zeitpunkt",
  greenChoiceLabel: "Grünste Wahl für deine Nachbarschaft",
  noSlotsLabel: "Keine Lieferzeitpunkte verfügbar.",
  closeAriaLabel: "Schließen",
  retryLabel: "Erneut versuchen",
  tapToChoose: "Tippen zum Auswählen",

  // Order summary
  depositBag: "Pfand Tasche",
  depositBottle: "Pfand Flasche",
  depositGeneric: "Pfand",
  orderSummaryTitle: "Bestellübersicht",
  itemsLabel: "Artikel",
  discountLabel: "Rabatt",
  membershipSavingsLabel: "Picnic-Mitgliedschaftsersparnis",
  minimumOrderLabel: "Mindestbestellwert",
  totalLabel: "Gesamt",

  // Quantity stepper
  removeOneAriaLabel: "1 entfernen",
  addOneAriaLabel: "1 hinzufügen",

  // Savings label
  savedSuffix: "gespart",

  // Product card
  addToCartAriaLabel: "Zum Warenkorb hinzufügen",
  addToCartButton: "In den Warenkorb",
  inCartLabel: "im Warenkorb",
  bundleFromLabel: "Ab",
  similarProductsTitle: "Ähnliche Produkte",
  descriptionTitle: "Beschreibung",

  // Category grid
  allCategoriesTitle: "Alle Kategorien",

  // Shortcut list
  shortcutSectionTitle: "Schnellzugriff",

  // Section nav bar
  sectionNavGoTo: "Gehe zu",

  // Category products view
  backButton: "Zurück",
  noProductsInCategory: "Keine Produkte in dieser Kategorie gefunden.",
  productSingular: "Produkt",
  productPlural: "Produkte",

  // Pages
  defaultPageTitle: "Produkte",
  noPageSpecified: "Keine Seite angegeben.",
  productsLoadError: "Produkte konnten nicht geladen werden.",

  // Cookbook
  cookbookTitle: "Alle Rezepte",
  cookbookFeatured: "Empfehlungen",
  cookbookSaved: "Gespeicherte Rezepte",
  cookbookSearchPlaceholder: "Nach Rezept oder Zutat suchen...",
  cookbookLoadError: "Rezepte konnten nicht geladen werden.",
  noRecipes: "Keine Rezepte gefunden.",
  cookingTimeMinutes: "Min.",
  cookbookCategoryLabel: "Kategorie",
  recipeSave: "Rezept speichern",
  recipeUnsave: "Rezept nicht mehr speichern",
  recipeSaveError: "Rezept konnte nicht gespeichert werden.",
  mealPlanSelectAll: "Alle auswählen",
  mealPlanDays: "Tage",
  mealPlanGenerate: "Plan generieren",
  mealPlanRegenerate: "Neu generieren",
  mealPlanSummary: "{n} Rezepte ausgewählt",

  // Auth
  signOut: "Abmelden",

  // App navigation
  navMainAriaLabel: "Hauptnavigation",
  navDiscover: "Entdecken",
  navFavorites: "Favoriten",
  navCooking: "Kochen",
  navSearch: "Suchen",
  navCart: "Korb",
  navAccount: "Konto",
  closeLabel: "Schließen",

  // Account panel
  accountParcels: "Paketservice",
  accountWallet: "Geldbörse",
  accountFriends: "Freunde werben",
  accountReminders: "Einkaufswecker",
  accountSupport: "Kundenservice",
  accountFaq: "Häufige Fragen",
  comingSoon: "Demnächst",

  // Discover and favorites placeholders
  discoverTitle: "Entdecken",
  favoritesTitle: "Favoriten",

  // Recipe detail
  recipeIngredients: "Zutaten",
  recipeSteps: "Zubereitung",
  recipePortions: "Personen",
  recipeAddToCart: "Alle Zutaten in den Warenkorb",
  recipeAddingToCart: "Wird hinzugefügt...",
  recipeAddedToCart: "Hinzugefügt!",
  recipeCondiments: "Hast du wahrscheinlich schon",
  recipeLoadError: "Rezept konnte nicht geladen werden.",
  recipePricePerServing: "pro Portion",
  recipePriceTotal: "gesamt",
  recipeAllergens: "Enthält",
  recipeMayContain: "Kann enthalten",
  recipeNutrition: "Nährwerte",

  // Toast / error view
  dismissAriaLabel: "Schließen",
  retryButton: "Erneut versuchen",

  // Generic error page
  errorHeading: "Ein Fehler ist aufgetreten",
  errorUnexpected: "Ein unerwarteter Fehler ist aufgetreten.",
  errorRetry: "Erneut versuchen",

  // Category page
  categoryFallbackTitle: "Kategorie",
  subcategoriesLoadError: "Unterkategorien konnten nicht geladen werden.",

  // Token login label
  authTokenLabel: "Picnic Auth-Token",

  // Search results count
  resultFor: "für",

  // Allergen badges
  allergenTitle: "Allergene",

  // Deliveries
  deliveriesTitle: "Bestellungen",
  deliveriesNavLabel: "Bestellungen",
  deliveriesTabAll: "Alle",
  deliveriesEmptyAll: "Noch keine Bestellungen.",
  deliveriesTabCurrent: "Aktuell",
  deliveriesTabCompleted: "Abgeschlossen",
  deliveriesTabCancelled: "Storniert",
  deliveriesEmptyCurrent: "Keine aktiven Bestellungen.",
  deliveriesEmptyCompleted: "Keine abgeschlossenen Bestellungen.",
  deliveriesEmptyCancelled: "Keine stornierten Bestellungen.",
  deliveriesLoadError: "Bestellungen konnten nicht geladen werden.",
  deliveriesLiveTrack: "Live verfolgen",
  deliveriesOrdersLabel: "Bestellungen",
  deliveriesStatusCurrent: "Aktiv",
  deliveriesStatusCompleted: "Abgeschlossen",
  deliveriesStatusCancelled: "Storniert",
  deliveriesStatusPlanned: "Geplant",
  deliveriesStatusEnRoute: "Unterwegs",
  deliveriesStatusDelivered: "Geliefert",
  deliveriesDetailTitle: "Bestellung",
  deliveriesDetailLoadError: "Bestellung konnte nicht geladen werden.",
  deliveriesWindowTitle: "Lieferzeitfenster",
  deliveriesPaymentTitle: "Zahlung",
  deliveriesPaymentType: "Zahlungsart",
  deliveriesReturnedContainers: "Zurückgegebenes Pfand",
  deliveriesCancelButton: "Bestellung stornieren",
  deliveriesCancelConfirmTitle: "Bestellung stornieren?",
  deliveriesCancelConfirmMessage: "Möchtest du diese Bestellung wirklich stornieren?",
  deliveriesCancelSuccess: "Bestellung storniert.",
  deliveriesCancelError: "Stornierung fehlgeschlagen. Bitte erneut versuchen.",
  deliveriesRateTitle: "Bewerte deine Lieferung",
  deliveriesRateSubmit: "Bewertung absenden",
  deliveriesRateSuccess: "Danke für deine Bewertung!",
  deliveriesRateError: "Bewertung konnte nicht gesendet werden.",
  deliveriesRateAlready: "Diese Bestellung wurde bereits bewertet.",
  deliveriesInvoiceButton: "Rechnung erneut senden",
  deliveriesInvoiceSuccess: "Rechnung wurde per E-Mail gesendet.",
  deliveriesInvoiceError: "Rechnung konnte nicht gesendet werden.",
  deliveriesParcelsTitle: "Pakete",
  deliveriesParcelsSubtitle: "Gib uns deine Pakete kostenlos mit.",
  deliveriesParcelsActive: "Aktiv",
  deliveriesParcelsProcessed: "Verarbeitet",
  deliveriesParcelName: "{carrier}-Paket",
  deliveriesParcelStatusHandedOver: "Von Picnic abgeholt",
  deliveriesParcelTrack: "Verfolgen",
  deliveriesTrackingDriver: "Fahrer",
  deliveriesTrackingEta: "Voraussichtliche Ankunft",
  deliveriesTrackingNoMap: "Live-Karte noch nicht verfügbar.",
  deliveriesTrackingLoading: "Tracking wird geladen...",
} satisfies Translations;
