import type { Translations } from "@/lib/core/i18n/types";

/** French (France) UI strings. */
export const fr = {
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
  checkoutPageTitle: "Paiement",
  checkoutLoadError: "Impossible de charger le paiement.",
  checkoutContinueButton: "Continuer vers le paiement",
  checkoutProcessing: "Traitement…",
  checkoutStartError: "Impossible de démarrer le paiement.",
  checkoutPaymentError: "Impossible de lancer le paiement.",
  checkoutPaymentTitle: "Informations de paiement",
  checkoutOrderTotal: "Total",
  checkoutExpires: "Valable jusqu'au",
  checkoutPayButton: "Vers la banque",
  checkoutReturnTitle: "Finaliser le paiement",
  checkoutMissingSession: "Aucune session de paiement active trouvée.",
  checkoutPollingMessage: "Nous vérifions votre paiement…",
  checkoutStatusLabel: "Statut",
  checkoutCancelPaymentButton: "Annuler le paiement",
  checkoutStatusError: "Impossible de récupérer le statut du paiement.",
  checkoutConfirmError: "Impossible de confirmer la commande.",
  checkoutCancelError: "Impossible d'annuler le paiement.",
  checkoutMinimumNotMet: "Montant minimum de commande non atteint.",

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
  deliveriesParcelsSubtitle: "Confiez-nous vos colis gratuitement.",
  deliveriesParcelsActive: "Actifs",
  deliveriesParcelsProcessed: "Traités",
  deliveriesParcelName: "Colis {carrier}",
  deliveriesParcelStatusHandedOver: "Récupéré par Picnic",
  deliveriesTrackingDriver: "Livreur",
  deliveriesTrackingEta: "Arrivée prévue",
  deliveriesTrackingNoMap: "Carte en direct pas encore disponible.",
  deliveriesTrackingLoading: "Chargement du suivi...",
} satisfies Translations;
