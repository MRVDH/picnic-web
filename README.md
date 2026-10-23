[![GitHub license](https://img.shields.io/badge/license-AGPL3.0-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-web/blob/master/LICENSE) [![MAAR3267](https://img.shields.io/badge/picnic%20discount-MAAR3267-E1171E?style=flat-square)](https://picnic.app/nl/vriendenkorting/MAAR3267)

# Picnic web

Unofficial web interface for the online supermarket Picnic. Uses the npm library [picnic-api](https://github.com/MRVDH/picnic-api).

Live version: [picnic.maartenvandenhoven.com](http://picnic.maartenvandenhoven.com)

## Part of a set

picnic-api, picnic-web and picnic-mcp are developed and released together. When the Picnic app changes how it gets its data, picnic-api follows it and picnic-web and picnic-mcp are updated in the same change, so their latest versions always work together.

| Project                                                                                                                                                             | What it is                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [picnic-api](https://github.com/MRVDH/picnic-api) [![npm](https://img.shields.io/npm/v/picnic-api.svg?style=flat-square)](https://www.npmjs.com/package/picnic-api) | Node.js library for Picnic's API: products, cart, delivery slots, deliveries and recipes.                                           |
| [picnic-web](https://github.com/MRVDH/picnic-web)                                                                                                                   | Web interface for Picnic, to shop from your browser. Live at [picnic.maartenvandenhoven.com](http://picnic.maartenvandenhoven.com). |
| [picnic-mcp](https://github.com/MRVDH/picnic-mcp) [![npm](https://img.shields.io/npm/v/picnic-mcp.svg?style=flat-square)](https://www.npmjs.com/package/picnic-mcp) | MCP server that lets AI assistants search products, fill your cart and pick a delivery slot.                                        |

<img width="1596" height="1279" alt="image" src="https://github.com/user-attachments/assets/dec2c62e-eb5d-4ccc-ae16-04703ac7558d" />

### FAQ

Frequently asked questions.

#### Why this when there is an app?

For when you don't have your phone with you but you'd still like to browse, manage your cart, etc.

#### Something broke, what now?

Please report issues in the [Github issues section](https://github.com/MRVDH/picnic-web/issues) or email me at [info@maartenvandenhoven.com](mailto:info@maartenvandenhoven.com).

#### How do I run a local instance?

Clone or download the repo, run `npm install`, `npm run build` and then `npm run start`.

#### How do I generate an auth key?

There's a small CLI for it. Copy `.env.example` to `.env`, fill in your Picnic email, password and country code (`NL`, `DE` or `FR`), then run `npm run auth-key`. If your account has 2FA enabled it asks for the SMS code and prints the auth key when done.
