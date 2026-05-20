"use client";

import { Suspense, useCallback, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { usePageTitle } from "@/hooks/use-page-title";
import { type Translations, getTranslations } from "@/lib/i18n";
import {
  COUNTRY_COOKIE_NAME,
  type CountryCode,
  DEFAULT_COUNTRY_CODE,
  SUPPORTED_COUNTRY_CODES,
} from "@/lib/types";

const DEFAULT_REDIRECT = "/";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? DEFAULT_REDIRECT;
  const isExpired = searchParams.get("expired") === "true";

  const [countryCode, setCountryCode] = useState<CountryCode>(() => {
    // Read existing cookie if present so the selector matches the stored choice.
    if (typeof document !== "undefined") {
      const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COUNTRY_COOKIE_NAME}=([^;]+)`));
      const val = match?.[1]?.toUpperCase();
      if (val && (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(val)) {
        return val as CountryCode;
      }
    }
    return DEFAULT_COUNTRY_CODE;
  });

  const t = getTranslations(countryCode);

  usePageTitle(t.loginTitle);

  const [credentialsMode, setCredentialsMode] = useState(false);
  const webClickCount = useRef(0);
  const webClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [partialToken, setPartialToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(isExpired ? t.sessionExpired : null);

  const clearError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const t = getTranslations(countryCode);
      setError(null);

      // ── 2FA verification step ──────────────────────────────────────────
      if (partialToken) {
        if (twoFactorCode.trim() === "") {
          setError(t.enter2FACode);
          return;
        }

        setIsLoading(true);

        try {
          const response = await fetch("/api/auth/verify-2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partialToken,
              code: twoFactorCode.trim(),
            }),
          });

          const data = await response.json();

          if (data.success) {
            window.location.href = redirectTo;
            return;
          }

          setError(mapErrorMessage(data.error, t));
        } catch {
          setError(t.verificationFailed);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── Credentials login ──────────────────────────────────────────────
      if (credentialsMode) {
        if (email.trim() === "" || password === "") {
          setError(t.enterEmailAndPassword);
          return;
        }

        setIsLoading(true);

        try {
          const response = await fetch("/api/auth/login-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password, countryCode }),
          });

          const data = await response.json();

          if (data.success) {
            window.location.href = redirectTo;
            return;
          }

          if (data.error === "2FA_REQUIRED" && data.partialToken) {
            setPartialToken(data.partialToken);
            setError(null);
            return;
          }

          setError(mapErrorMessage(data.error, t));
        } catch {
          setError(t.loginFailed);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── Token login ────────────────────────────────────────────────────
      const trimmed = token.trim();
      if (trimmed === "") {
        setError(t.enterToken);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: trimmed, countryCode }),
        });

        const data = await response.json();

        if (data.success) {
          window.location.href = redirectTo;
          return;
        }

        setError(mapErrorMessage(data.error, t));
      } catch {
        setError(t.tokenVerifyFailed);
      } finally {
        setIsLoading(false);
      }
    },
    [partialToken, twoFactorCode, credentialsMode, token, email, password, countryCode, redirectTo]
  );

  // Determine which fields to render
  const showTwoFactor = credentialsMode && partialToken !== null;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            className="text-picnic-red text-5xl font-bold tracking-tight select-none"
            aria-label="Picnic Web"
          >
            Picnic{" "}
            <span
              onClick={() => {
                webClickCount.current += 1;
                if (webClickTimer.current) {
                  clearTimeout(webClickTimer.current);
                }
                if (webClickCount.current >= 5) {
                  webClickCount.current = 0;
                  setCredentialsMode((prev) => !prev);
                  setPartialToken(null);
                  setTwoFactorCode("");
                  setError(null);
                } else {
                  webClickTimer.current = setTimeout(() => {
                    webClickCount.current = 0;
                  }, 1000);
                }
              }}
              className="cursor-default"
            >
              Web
            </span>
          </span>
        </div>

        {/* Country selector */}
        <div className="mb-6 flex justify-center gap-2">
          {SUPPORTED_COUNTRY_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCountryCode(code)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                code === countryCode
                  ? "bg-picnic-red text-white"
                  : "border-input-border hover:text-foreground border text-gray-500"
              }`}
              aria-pressed={code === countryCode}
            >
              {code}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showTwoFactor ? (
            <div>
              <p className="mb-3 text-sm text-gray-600">{t.smsSent}</p>
              <label
                htmlFor="two-factor-code"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                {t.verificationCodeLabel}
              </label>
              <input
                id="two-factor-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e) => {
                  setTwoFactorCode(e.target.value);
                  clearError();
                }}
                placeholder={t.verificationCodePlaceholder}
                disabled={isLoading}
                autoFocus
                className="border-input-border text-foreground focus:border-input-focus focus:ring-input-focus w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none disabled:opacity-50"
              />
            </div>
          ) : credentialsMode ? (
            <>
              <div>
                <label htmlFor="email" className="text-foreground mb-1 block text-sm font-medium">
                  {t.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  placeholder={t.emailPlaceholder}
                  disabled={isLoading}
                  autoFocus
                  className="border-input-border text-foreground focus:border-input-focus focus:ring-input-focus w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="text-foreground mb-1 block text-sm font-medium"
                >
                  {t.passwordLabel}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder={t.passwordPlaceholder}
                  disabled={isLoading}
                  className="border-input-border text-foreground focus:border-input-focus focus:ring-input-focus w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none disabled:opacity-50"
                />
              </div>
            </>
          ) : (
            <div>
              <label
                htmlFor="auth-token"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                Picnic Auth Token
              </label>
              <div className="relative">
                <input
                  id="auth-token"
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    clearError();
                  }}
                  placeholder={t.tokenPlaceholder}
                  disabled={isLoading}
                  autoFocus
                  className="border-input-border text-foreground focus:border-input-focus focus:ring-input-focus w-full rounded-lg border px-3 py-2 pr-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  aria-label={showToken ? t.hideToken : t.showToken}
                >
                  {showToken ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-picnic-red hover:bg-picnic-red-dark focus:ring-picnic-red flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? <Spinner /> : showTwoFactor ? t.verifyButton : t.loginButton}
          </button>
        </form>

        {!credentialsMode && (
          <>
            <TokenInstructions countryCode={countryCode} t={t} />
            <WhyAuthToken t={t} />
          </>
        )}
        <Disclaimer t={t} />
      </div>
    </div>
  );
}

// ─── Token Instructions ──────────────────────────────────────────────────────

const PICNIC_API_NPM_URL = "https://www.npmjs.com/package/picnic-api";

function TokenInstructions({ countryCode, t }: { countryCode: CountryCode; t: Translations }) {
  const snippet = `import PicnicClient from "picnic-api";\n\nconst client = new PicnicClient({ countryCode: "${countryCode}" });\nawait client.auth.login("${t.codeSnippetEmail}", "${t.codeSnippetPassword}");\nconsole.log(client.authKey);`;
  return (
    <details className="border-card-border mt-6 rounded-lg border bg-white p-4 text-sm text-gray-600">
      <summary className="text-foreground font-medium">{t.howToGetToken}</summary>
      <div className="mt-3 space-y-3">
        <p>
          {t.npmPackageUseBefore}{" "}
          <a
            href={PICNIC_API_NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-picnic-red hover:text-picnic-red-dark font-medium underline"
          >
            picnic-api
          </a>{" "}
          {t.npmPackageText}
        </p>
        <pre className="overflow-x-auto rounded-md bg-gray-100 p-3 text-xs leading-relaxed">
          <code>{snippet}</code>
        </pre>
        <p>
          {t.copyAuthKeyBefore} <code className="rounded bg-gray-100 px-1">authKey</code>{" "}
          {t.copyAuthKeyAfter}
        </p>
      </div>
    </details>
  );
}

// ─── Why Auth Token ──────────────────────────────────────────────────────────

function WhyAuthToken({ t }: { t: Translations }) {
  return (
    <details className="border-card-border mt-3 rounded-lg border bg-white p-4 text-sm text-gray-600">
      <summary className="text-foreground font-medium">{t.whyAuthToken}</summary>
      <div className="mt-3 space-y-3">
        <p>{t.whyAuthTokenBody}</p>
      </div>
    </details>
  );
}

// ─── Disclaimer ──────────────────────────────────────────────────────────────

const GITHUB_PROJECT_URL = "https://github.com/MRVDH/picnic-web";

function Disclaimer({ t }: { t: Translations }) {
  return (
    <details className="border-card-border mt-3 rounded-lg border bg-white p-4 text-sm text-gray-600">
      <summary className="text-foreground font-medium">{t.isOfficialSite}</summary>
      <div className="mt-3 space-y-3">
        <p>
          {t.isOfficialSiteBody}{" "}
          <a
            href={GITHUB_PROJECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-picnic-red hover:text-picnic-red-dark font-medium underline"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </details>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapErrorMessage(code: string | undefined, t: Translations): string {
  switch (code) {
    case "TOKEN_INVALID":
      return t.tokenInvalid;
    case "CREDENTIALS_INVALID":
      return t.credentialsInvalid;
    case "2FA_INVALID":
      return t.twoFAInvalid;
    case "API_UNREACHABLE":
      return t.apiUnreachable;
    default:
      return t.genericError;
  }
}

// ─── Icons & Loading ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
      role="status"
      aria-label="Laden"
    />
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.092 1.092a4 4 0 0 0-5.558-5.558Z"
        clipRule="evenodd"
      />
      <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0 1 10 17a10.004 10.004 0 0 1-9.336-6.41 1.651 1.651 0 0 1 0-1.186 10.007 10.007 0 0 1 2.638-3.55l2.328 2.328A4 4 0 0 0 10.748 13.93Z" />
    </svg>
  );
}

function LoginSkeleton() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="border-t-picnic-red h-5 w-5 animate-spin rounded-full border-2 border-gray-200" />
    </div>
  );
}
