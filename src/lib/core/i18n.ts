import type { CountryCode } from "@/lib/core/types";

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
    deliveriesTrackingDriver: "Bezorger",
    deliveriesTrackingEta: "Verwachte aankomst",
    deliveriesTrackingNoMap: "Live routekaart is nog niet beschikbaar.",
    deliveriesTrackingLoading: "Tracking laden...",
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
    deliveriesTrackingDriver: "Fahrer",
    deliveriesTrackingEta: "Voraussichtliche Ankunft",
    deliveriesTrackingNoMap: "Live-Karte noch nicht verfügbar.",
    deliveriesTrackingLoading: "Tracking wird geladen...",
  },
  FR: {
    // Search bar
    searchPlaceholder: "Rechercher des produits...",
    searchAriaLabel: "Rechercher des produits",
    searchButtonAriaLabel: "Rechercher",

    // Home page errors
    searchError: "Une erreur s'est produite. Veuillez réessayer plus tard.",
    categoriesLoadError: "Impossible de charger les catégories.",

    // Results view
    noResultsFor: "Aucun résultat trouvé pour",
    tryAnotherTerm: "Essayez un autre terme de recherche",
    resultSingular: "résultat",
    resultPlural: "résultats",

    // Login page
    loginTitle: "Connexion",
    sessionExpired: "Votre session a expiré. Veuillez vous reconnecter.",
    enter2FACode: "Saisissez le code de vérification",
    verificationFailed: "Échec de la vérification. Veuillez réessayer plus tard.",
    enterEmailAndPassword: "Saisissez votre adresse e-mail et votre mot de passe",
    loginFailed: "Échec de la connexion. Veuillez réessayer plus tard.",
    enterToken: "Saisissez un token",
    tokenVerifyFailed: "Impossible de vérifier le token. Veuillez réessayer plus tard.",
    smsSent: "Un code de vérification a été envoyé sur votre téléphone par SMS.",
    verificationCodeLabel: "Code de vérification",
    verificationCodePlaceholder: "Saisissez le code",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "votre-email@exemple.fr",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Votre mot de passe",
    tokenPlaceholder: "Collez votre token ici",
    hideToken: "Masquer le token",
    showToken: "Afficher le token",
    verifyButton: "Vérifier",
    loginButton: "Se connecter",
    howToGetToken: "Comment obtenir un token d'authentification ?",
    npmPackageUseBefore: "Utilisez le",
    npmPackageText: "package npm pour vous connecter avec votre compte Picnic :",
    copyAuthKeyBefore: "Copiez la valeur",
    copyAuthKeyAfter: "et collez-la ci-dessus.",
    whyAuthToken: "Pourquoi ai-je besoin d'un token d'authentification ?",
    whyAuthTokenBody:
      "Pour des raisons de sécurité, nous n'affichons pas de formulaire de connexion standard avec adresse e-mail et mot de passe. Un token d'authentification garantit que vos identifiants ne sont jamais transmis via ce site. Le token peut être révoqué à tout moment sans changer votre mot de passe.",
    isOfficialSite: "Est-ce le site officiel de Picnic ?",
    isOfficialSiteBody:
      "Non, ce n'est pas le site officiel de Picnic. Il s'agit d'un projet open source indépendant qui n'est en aucune façon affilié à Picnic. Consultez le code source sur",
    tokenInvalid: "Le token est invalide. Veuillez réessayer.",
    credentialsInvalid: "Adresse e-mail ou mot de passe incorrect. Veuillez réessayer.",
    twoFAInvalid: "Le code de vérification est incorrect. Veuillez réessayer.",
    apiUnreachable: "Impossible de se connecter à Picnic. Veuillez réessayer plus tard.",
    genericError: "Une erreur s'est produite. Veuillez réessayer plus tard.",
    loadingAriaLabel: "Chargement",
    codeSnippetEmail: "votre-email",
    codeSnippetPassword: "votre-mot-de-passe",

    // Cart
    emptyCartTitle: "Votre panier est vide",
    emptyCartText: "Ajoutez des produits via l'application Picnic ou recherchez quelque chose.",
    goToSearch: "Aller à la recherche",
    cartTitle: "Panier",
    nothingForgotten: "Rien oublié ?",
    cartMutationError: "Une erreur s'est produite. Veuillez réessayer.",
    cartLoadError: "Une erreur s'est produite. Veuillez réessayer plus tard.",
    cartOtherItems: "Autres produits",
    clearCartButton: "Vider le panier",
    clearCartError: "Impossible de vider le panier. Veuillez réessayer.",
    clearCartConfirmTitle: "Vider le panier ?",
    clearCartConfirmMessage: "Tous les produits seront supprimés de votre panier.",
    confirmButton: "Confirmer",
    cancelButton: "Annuler",

    // Checkout
    checkoutLabel: "Passer à la caisse",
    checkoutDeepLinkCountry: "fr",

    // Delivery slot picker
    pickerTitle: "Choisissez votre créneau de livraison",
    freeDeliveryLabel: "Toujours livré gratuitement !",
    selectedSectionLabel: "Sélectionné par vous",
    otherMomentLabel: "Ou choisissez un autre moment",
    greenChoiceLabel: "Choix le plus écologique pour votre quartier",
    noSlotsLabel: "Aucun créneau de livraison disponible.",
    closeAriaLabel: "Fermer",
    retryLabel: "Réessayer",
    tapToChoose: "Appuyez pour choisir",

    // Order summary
    depositBag: "Consigne sac",
    depositBottle: "Consigne bouteille",
    depositGeneric: "Consigne",
    orderSummaryTitle: "Récapitulatif de la commande",
    itemsLabel: "Articles",
    discountLabel: "Réduction",
    membershipSavingsLabel: "Économies d'adhésion Picnic",
    minimumOrderLabel: "Montant minimum de commande",
    totalLabel: "Total",

    // Quantity stepper
    removeOneAriaLabel: "Retirer 1",
    addOneAriaLabel: "Ajouter 1",

    // Savings label
    savedSuffix: "économisé",

    // Product card
    addToCartAriaLabel: "Ajouter au panier",
    addToCartButton: "Au panier",
    inCartLabel: "dans le panier",
    bundleFromLabel: "À partir de",
    similarProductsTitle: "Produits similaires",
    descriptionTitle: "Description",

    // Category grid
    allCategoriesTitle: "Toutes les catégories",

    // Shortcut list
    shortcutSectionTitle: "Accès rapide",

    // Section nav bar
    sectionNavGoTo: "Aller à",

    // Category products view
    backButton: "Retour",
    noProductsInCategory: "Aucun produit trouvé dans cette catégorie.",
    productSingular: "produit",
    productPlural: "produits",

    // Pages
    defaultPageTitle: "Produits",
    noPageSpecified: "Aucune page spécifiée.",
    productsLoadError: "Impossible de charger les produits.",

    // Cookbook
    cookbookTitle: "Toutes les recettes",
    cookbookFeatured: "À la une",
    cookbookSaved: "Recettes enregistrées",
    cookbookSearchPlaceholder: "Rechercher une recette ou un ingrédient...",
    cookbookLoadError: "Impossible de charger les recettes.",
    noRecipes: "Aucune recette trouvée.",
    cookingTimeMinutes: "min",
    cookbookCategoryLabel: "Catégorie",
    recipeSave: "Enregistrer la recette",
    recipeUnsave: "Ne plus enregistrer la recette",
    recipeSaveError: "La recette n'a pas pu être enregistrée.",
    mealPlanSelectAll: "Tout sélectionner",
    mealPlanDays: "jours",
    mealPlanGenerate: "Générer le plan",
    mealPlanRegenerate: "Régénérer",
    mealPlanSummary: "{n} recettes sélectionnées",

    // Auth
    signOut: "Se déconnecter",

    // Recipe detail
    recipeIngredients: "Ingrédients",
    recipeSteps: "Préparation",
    recipePortions: "Personnes",
    recipeAddToCart: "Ajouter tous les ingrédients",
    recipeAddingToCart: "Ajout en cours...",
    recipeAddedToCart: "Ajouté !",
    recipeCondiments: "Vous avez probablement déjà",
    recipeLoadError: "Impossible de charger la recette.",
    recipePricePerServing: "par portion",
    recipePriceTotal: "total",
    recipeAllergens: "Contient",
    recipeMayContain: "Peut contenir",
    recipeNutrition: "Valeurs nutritionnelles",

    // Toast / error view
    dismissAriaLabel: "Fermer",
    retryButton: "Réessayer",

    // Generic error page
    errorHeading: "Une erreur s'est produite",
    errorUnexpected: "Une erreur inattendue s'est produite.",
    errorRetry: "Réessayer",

    // Category page
    categoryFallbackTitle: "Catégorie",
    subcategoriesLoadError: "Impossible de charger les sous-catégories.",

    // Token login label
    authTokenLabel: "Token d'authentification Picnic",

    // Search results count
    resultFor: "pour",

    // Allergen badges
    allergenTitle: "Allergènes",

    // Deliveries
    deliveriesTitle: "Commandes",
    deliveriesNavLabel: "Commandes",
    deliveriesTabCurrent: "En cours",
    deliveriesTabCompleted: "Terminées",
    deliveriesTabCancelled: "Annulées",
    deliveriesEmptyCurrent: "Aucune commande en cours.",
    deliveriesEmptyCompleted: "Aucune commande terminée.",
    deliveriesEmptyCancelled: "Aucune commande annulée.",
    deliveriesLoadError: "Impossible de charger les commandes.",
    deliveriesLiveTrack: "Suivre en direct",
    deliveriesOrdersLabel: "commandes",
    deliveriesStatusCurrent: "En cours",
    deliveriesStatusCompleted: "Terminée",
    deliveriesStatusCancelled: "Annulée",
    deliveriesStatusPlanned: "Planifiée",
    deliveriesStatusEnRoute: "En route",
    deliveriesStatusDelivered: "Livrée",
    deliveriesDetailTitle: "Commande",
    deliveriesDetailLoadError: "Impossible de charger la commande.",
    deliveriesWindowTitle: "Créneau de livraison",
    deliveriesPaymentTitle: "Paiement",
    deliveriesPaymentType: "Mode de paiement",
    deliveriesReturnedContainers: "Consignes retournées",
    deliveriesCancelButton: "Annuler la commande",
    deliveriesCancelConfirmTitle: "Annuler la commande ?",
    deliveriesCancelConfirmMessage: "Voulez-vous vraiment annuler cette commande ?",
    deliveriesCancelSuccess: "Commande annulée.",
    deliveriesCancelError: "Échec de l'annulation. Veuillez réessayer.",
    deliveriesRateTitle: "Évaluez votre livraison",
    deliveriesRateSubmit: "Envoyer l'évaluation",
    deliveriesRateSuccess: "Merci pour votre évaluation !",
    deliveriesRateError: "Impossible d'envoyer l'évaluation.",
    deliveriesRateAlready: "Cette commande a déjà été évaluée.",
    deliveriesInvoiceButton: "Renvoyer la facture",
    deliveriesInvoiceSuccess: "Facture envoyée par e-mail.",
    deliveriesInvoiceError: "Impossible d'envoyer la facture.",
    deliveriesParcelsTitle: "Colis",
    deliveriesTrackingDriver: "Livreur",
    deliveriesTrackingEta: "Arrivée prévue",
    deliveriesTrackingNoMap: "Carte en direct pas encore disponible.",
    deliveriesTrackingLoading: "Chargement du suivi...",
  },
} as const;

export type Translations = { readonly [K in keyof typeof translations.NL]: string };

export function getTranslations(countryCode: CountryCode): Translations {
  return translations[countryCode];
}
