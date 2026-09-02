import { de } from "@/lib/core/i18n/de";
import { fr } from "@/lib/core/i18n/fr";
import { nl } from "@/lib/core/i18n/nl";
import type { Translations } from "@/lib/core/i18n/types";
import type { CountryCode } from "@/lib/core/types";

export type { Translations };

const translations = { NL: nl, DE: de, FR: fr } as const;

export function getTranslations(countryCode: CountryCode): Translations {
  return translations[countryCode];
}
