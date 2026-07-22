#!/usr/bin/env node

// Interactive CLI to obtain a Picnic auth key for local development.
// Reads credentials from .env (see .env.example) and walks the 2FA SMS
// flow when the account requires it. Run with: npm run auth-key
import "dotenv/config";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import PicnicClient from "picnic-api";

const SUPPORTED_COUNTRY_CODES = ["NL", "DE"];

const { PICNIC_EMAIL, PICNIC_PASSWORD, COUNTRY_CODE } = process.env;

if (!PICNIC_EMAIL || !PICNIC_PASSWORD || !COUNTRY_CODE) {
  console.error("Please set PICNIC_EMAIL, PICNIC_PASSWORD and COUNTRY_CODE in your .env file.");
  process.exit(1);
}

if (!SUPPORTED_COUNTRY_CODES.includes(COUNTRY_CODE)) {
  console.error(`COUNTRY_CODE must be one of: ${SUPPORTED_COUNTRY_CODES.join(", ")}.`);
  process.exit(1);
}

const client = new PicnicClient({ countryCode: COUNTRY_CODE });

async function verify2FA() {
  const rl = createInterface({ input, output });

  try {
    console.log("Requesting SMS code...");
    await client.auth.generate2FACode("SMS");

    const code = (await rl.question("Enter the SMS code: ")).trim();
    if (!code) {
      throw new Error("No code entered.");
    }

    console.log("Verifying...");
    const { authKey } = await client.auth.verify2FACode(code);
    return authKey;
  } finally {
    rl.close();
  }
}

async function main() {
  console.log("Logging in...");
  const login = await client.auth.login(PICNIC_EMAIL, PICNIC_PASSWORD);

  const authKey = login.second_factor_authentication_required ? await verify2FA() : login.authKey;

  if (!authKey) {
    throw new Error("Login failed: no auth key returned. Check your credentials.");
  }

  console.log("\n✅ Auth key:");
  console.log(authKey);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
