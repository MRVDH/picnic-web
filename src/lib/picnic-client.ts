/**
 * Server-side Picnic API client singleton.
 * Uses the picnic-api package from the parent directory.
 */

// The parent package uses `export =` (CJS), so we use require()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PicnicClient = require("../../../lib/index");

let client: any = null;

export function getPicnicClient(): any {
  if (!client) {
    const authKey = process.env.PICNIC_AUTH_KEY;
    if (!authKey) {
      throw new Error("PICNIC_AUTH_KEY environment variable is required. Set it in picnic-web/.env.local");
    }
    client = new PicnicClient({
      countryCode: (process.env.PICNIC_COUNTRY_CODE as "NL" | "DE") || "NL",
      authKey,
    });
  }
  return client;
}
