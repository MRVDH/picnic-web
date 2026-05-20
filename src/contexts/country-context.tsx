"use client";

import { type ReactNode, createContext, useCallback, useContext } from "react";

import { type Translations, getTranslations } from "@/lib/i18n";
import { COUNTRY_COOKIE_NAME, type CountryCode, DEFAULT_COUNTRY_CODE } from "@/lib/types";

const COUNTRY_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const CountryCodeContext = createContext<CountryCode>(DEFAULT_COUNTRY_CODE);
const SwitchCountryContext = createContext<(code: CountryCode) => void>(() => {});

export function CountryCodeProvider({
  children,
  initialCountry,
}: {
  children: ReactNode;
  initialCountry: CountryCode;
}) {
  const switchCountry = useCallback((code: CountryCode) => {
    document.cookie = `${COUNTRY_COOKIE_NAME}=${code}; path=/; max-age=${COUNTRY_COOKIE_MAX_AGE}; samesite=lax`;
    window.location.reload();
  }, []);

  return (
    <CountryCodeContext.Provider value={initialCountry}>
      <SwitchCountryContext.Provider value={switchCountry}>
        {children}
      </SwitchCountryContext.Provider>
    </CountryCodeContext.Provider>
  );
}

export function useCountryCode(): CountryCode {
  return useContext(CountryCodeContext);
}

export function useSwitchCountry(): (code: CountryCode) => void {
  return useContext(SwitchCountryContext);
}

export function useTranslations(): Translations {
  return getTranslations(useContext(CountryCodeContext));
}
