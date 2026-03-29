/* eslint-disable @typescript-eslint/no-require-imports */
import { COUNTRY_CODE } from "./types";

/**
 * picnic-api uses `export = class PicnicClient` (CJS module.exports).
 * We require() it to avoid ESM/CJS interop issues with Turbopack.
 */
const PicnicClient = require("picnic-api") as typeof import("picnic-api");

type PicnicClientInstance = InstanceType<typeof PicnicClient>;

let instance: PicnicClientInstance | null = null;

/**
 * Returns a singleton PicnicClient instance.
 * Reads the auth token from the PICNIC_AUTH_TOKEN environment variable.
 * Must only be called server-side (route handlers).
 */
export function getPicnicClient(): PicnicClientInstance {
  if (instance) {
    return instance;
  }

  const authKey = process.env.PICNIC_AUTH_TOKEN;
  if (!authKey) {
    throw new Error("PICNIC_AUTH_TOKEN environment variable is not set");
  }

  instance = new PicnicClient({
    countryCode: COUNTRY_CODE,
    authKey,
  });

  return instance;
}
