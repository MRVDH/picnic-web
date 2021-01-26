[![GitHub license](https://img.shields.io/badge/license-AGPL3.0-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-web/blob/master/LICENSE) [![Buy me an Affligem blond](https://img.shields.io/badge/buy%20me%20an-affligem%20blond-orange?style=flat-square)](https://www.buymeacoffee.com/MRVDH) [![MAAR3267](https://img.shields.io/badge/picnic%20discount-MAAR3267-E1171E?style=flat-square)](https://picnic.app/nl/vriendenkorting/MAAR3267)

# Picnic web
Unofficial (unaffiliated) web interface for the online supermarket Picnic. Uses the npm library [picnic-api](https://github.com/MRVDH/picnic-api).

Live version: [picnic.maartenvandenhoven.com](http://picnic.maartenvandenhoven.com)

![picnic-web-screenshot](https://i.imgur.com/k2IMc5J.png)

### FAQ
Frequently asked questions.

#### Why this when there is an app?
For when you don't have your phone with you but you'd still like to browse, manage your cart, etc.

#### I don't have a Picnic account.
You can see the products, but you'll need to login to manage your cart and account. Consider signing up and using my discount code [MAAR3267](https://picnic.app/nl/vriendenkorting/MAAR3267) so that we both get a 5 euro discount on our orders. 😄

#### Something broke, what now?
Please report issues in the [Github issues section](https://github.com/MRVDH/picnic-web/issues) or email me at [info@maartenvandenhoven.com](mailto:info@maartenvandenhoven.com).

#### How do I run a local instance?
Clone or download the repo, run `npm install` in both the main directory and the `./client` directory. Then open two terminals. In the first terminal open the main directory and run `node app.js`, and in the other terminal open the `./client` directory and run `npm run serve`.