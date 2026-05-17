import type { CountryCode } from "./types";

const translations = {
  NL: {
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

    // Checkout
    checkoutLabel: "Naar de kassa",
    checkoutDeepLinkCountry: "nl",

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
    cookbookSearchPlaceholder: "Zoek op recept of ingrediënt...",
    cookbookLoadError: "Recepten konden niet worden geladen.",
    noRecipes: "Geen recepten gevonden.",
    cookingTimeMinutes: "min",

    // Auth
    signOut: "Uitloggen",

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
  },
  DE: {
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

    // Checkout
    checkoutLabel: "Zur Kasse",
    checkoutDeepLinkCountry: "de",

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

    // Category grid
    allCategoriesTitle: "Alle Kategorien",

    // Shortcut list
    shortcutSectionTitle: "Schnell zu",

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
    cookbookSearchPlaceholder: "Nach Rezept oder Zutat suchen...",
    cookbookLoadError: "Rezepte konnten nicht geladen werden.",
    noRecipes: "Keine Rezepte gefunden.",
    cookingTimeMinutes: "Min.",

    // Auth
    signOut: "Abmelden",

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
  },
} as const;

export type Translations = { readonly [K in keyof typeof translations.NL]: string };

export function getTranslations(countryCode: CountryCode): Translations {
  return translations[countryCode];
}
