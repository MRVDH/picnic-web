/* eslint-disable @typescript-eslint/no-require-imports */
import { type CountryCode, DEFAULT_COUNTRY_CODE } from "./types";

/**
 * picnic-api uses `export = class PicnicClient` (CJS module.exports).
 * We require() it to avoid ESM/CJS interop issues with Turbopack.
 */
const PicnicClient = require("picnic-api") as typeof import("picnic-api");

export type PicnicClientInstance = InstanceType<typeof PicnicClient>;

/**
 * Create a new PicnicClient instance with the given auth token.
 * Must only be called server-side (route handlers).
 *
 * Each call creates a fresh instance — no cached state.
 * PicnicClient construction is cheap (plain object, no I/O).
 */
export function buildPicnicClient(
  authToken: string,
  countryCode: CountryCode = DEFAULT_COUNTRY_CODE
): PicnicClientInstance {
  return new PicnicClient({
    countryCode,
    authKey: authToken,
  });
}

/**
 * Create a new PicnicClient instance without an auth token.
 * Used for login-by-credentials where the authKey is not yet known.
 * Must only be called server-side (route handlers).
 */
export function buildPicnicClientAnonymous(
  countryCode: CountryCode = DEFAULT_COUNTRY_CODE
): PicnicClientInstance {
  return new PicnicClient({
    countryCode,
  });
}
