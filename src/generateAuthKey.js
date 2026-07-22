#!/usr/bin/env node

import "dotenv/config";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import PicnicClient from "picnic-api";

const { PICNIC_EMAIL: EMAIL, PICNIC_PASSWORD: PASSWORD, COUNTRY_CODE: COUNTRYCODE } = process.env;

if (!EMAIL || !PASSWORD || !COUNTRYCODE) {
  console.error("Please set PICNIC_EMAIL, PICNIC_PASSWORD and COUNTRY_CODE in your .env file.");
  process.exit(1);
}

const client = new PicnicClient({
  countryCode: COUNTRYCODE,
});

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

  const auth = await client.auth.login(EMAIL, PASSWORD);

  const authKey = auth.second_factor_authentication_required ? await verify2FA() : auth.authKey;

  console.log("\n✅ Auth Key:");
  console.log(authKey);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
