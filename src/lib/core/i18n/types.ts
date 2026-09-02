import type { nl } from "@/lib/core/i18n/nl";

/** Every language file must provide exactly the keys the Dutch one defines. */
export type Translations = { readonly [K in keyof typeof nl]: string };
