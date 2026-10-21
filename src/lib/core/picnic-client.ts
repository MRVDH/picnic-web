/* eslint-disable @typescript-eslint/no-require-imports */
import type PicnicApi from "picnic-api";

import { type CountryCode, DEFAULT_COUNTRY_CODE } from "@/lib/core/types";

/**
 * picnic-api uses `export = class PicnicClient` (CJS module.exports).
 * We require() it to avoid ESM/CJS interop issues with Turbopack.
 */
const PicnicClient = require("picnic-api") as typeof import("picnic-api");

export type PicnicClientInstance = InstanceType<typeof PicnicClient>;

/**
 * True for an error status from Picnic: the error carries the HTTP `status`, Picnic's
 * error `code` and the response `body`.
 */
export const isPicnicApiError = PicnicClient.isPicnicApiError;

type RscPageContent = PicnicApi.Types.pages.RscPageContent;

/**
 * Fetch a page the web reads as Fusion. Throws an UnexpectedPageFormatError when Picnic
 * serves it as RSC, so the route fails clearly instead of parsing the wrong format.
 */
export async function getFusionPage(
  client: PicnicClientInstance,
  pageId: string
): Promise<unknown> {
  const page = await client.app.getPage(pageId);
  if (page.format !== "fusion") throw new PicnicClient.UnexpectedPageFormatError(pageId, "rsc");
  return page.page;
}

/** Fetch a page the web renders as RSC. Throws an UnexpectedPageFormatError for a Fusion page. */
export async function getRscPageContent(
  client: PicnicClientInstance,
  pageId: string
): Promise<RscPageContent> {
  const page = await client.app.getPage(pageId);
  if (page.format !== "rsc") throw new PicnicClient.UnexpectedPageFormatError(pageId, "fusion");
  return page.content;
}

/** True when Picnic serves its "product not found" page: unknown, or not sold at the user's location. */
export const isProductNotFoundError = PicnicClient.isProductNotFoundError;

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
