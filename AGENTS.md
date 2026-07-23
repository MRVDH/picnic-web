# picnic-web

Unofficial web interface for the Picnic online supermarket. Talks to Picnic
through the [picnic-api](https://github.com/MRVDH/picnic-api) library. No
backend of its own and no database: all data is fetched on demand from the
Picnic API, and state lives in the URL, cookies, or client memory.

## Stack

TypeScript, Node 20+, Next.js (App Router), React 19, Tailwind CSS 4, and the
picnic-api client library. Exact versions live in [package.json](package.json).

## Project structure

- `src/app` — App Router routes; `src/app/api/*` are the server-side API routes
- `src/components` — React components
- `src/contexts` — React context providers (cart, country)
- `src/hooks` — custom hooks
- `src/lib` — API client, parsers, formatters, types, i18n
- `src/proxy.ts`, `src/generate-auth-key.mjs` — proxy config and the
  `npm run auth-key` CLI

Path alias: `@/*` maps to `src/*`.

## Conventions

- **Data flow.** No backend of its own. Client components never call Picnic
  directly — they fetch same-origin `/api/*` routes. Each route builds a
  server-side client with `buildPicnicClient(token, countryCode)`
  ([src/lib/picnic-client.ts](src/lib/picnic-client.ts)); the client is
  server-only, never import it into a client component.
- **API routes** follow one contract: read the token with `readAuthToken`
  ([src/lib/auth.ts](src/lib/auth.ts)) and return 401 `{ code: "TOKEN_EXPIRED" }`
  if absent; read the country with `readCountryCode`; wrap Picnic calls in
  try/catch and use `isApiAuthError` ([src/lib/api-error.ts](src/lib/api-error.ts))
  to map auth failures to 401, otherwise log `[/api/<route>]` and return 502.
  Follow an existing route (e.g. [src/app/api/search/route.ts](src/app/api/search/route.ts))
  when adding one.
- **`lib/` helpers.** `parse-*` transform raw Picnic/Fusion responses into app
  types, `format-*` format values for display, `extract-*` pull fields;
  `types.ts` is the shared type home. Reuse these instead of inlining transforms.
- **Internationalization.** Supported countries and locale logic live in
  [src/lib/i18n.ts](src/lib/i18n.ts) (`CountryCode`). Any user-facing formatting —
  prices, delivery windows, image language — must work for every supported
  country.

## Commands

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` — ESLint (eslint-config-next, core-web-vitals + TS)
- `npm run format` / `npm run format:check` — Prettier
- `npm run auth-key` — CLI to generate a Picnic auth key (see README)

There is no test suite. Verify changes with `npm run lint` and a build.

## Code style

Prettier enforced ([.prettierrc](.prettierrc)): 2-space indent, semicolons,
double quotes, 100-char width, es5 trailing commas. Imports are auto-sorted by
`@trivago/prettier-plugin-sort-imports` (react → next → third-party → `@/` →
relative), so don't hand-order imports. Run `npm run format` before committing.

## Environment

The app itself needs no env file: it authenticates per user via the
`picnic_auth_token` cookie. The `.env` is only for the `npm run auth-key` CLI.
To use it, copy `.env.example` to `.env` and set `PICNIC_EMAIL`,
`PICNIC_PASSWORD`, and `COUNTRY_CODE` (`NL`, `DE`, or `FR`).
