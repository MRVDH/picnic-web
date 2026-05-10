"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { type CountryCode, DEFAULT_COUNTRY_CODE, COUNTRY_COOKIE_NAME } from "@/lib/types";

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
