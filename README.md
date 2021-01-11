[![GitHub license](https://img.shields.io/badge/license-AGPL3.0-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-web/blob/master/LICENSE)
[![Buy me an Affligem blond](https://img.shields.io/badge/buy%20me%20an-affligem%20blond-orange?style=flat-square)](https://www.buymeacoffee.com/MRVDH)

# Picnic web
Unofficial (unaffiliated) web interface for the online supermarket Picnic. Uses the npm library [picnic-api](https://github.com/MRVDH/picnic-api).

Live version: [picnic.maartenvandenhoven.com](http://picnic.maartenvandenhoven.com)

![picnic-web-screenshot](https://i.imgur.com/lfXafmk.png)

### FAQ

#### Where are the images?
I have not been able to retreive images from the picnic server yet.

#### Why this when there is an app?
For when you don't have your phone with you but you'd still like to browse, manage your cart, etc.

#### I can't find feature X, where is it?
Todo: User settings, selecting delivery slots, password reset.

#### Something broke, what now?
Please report issues in the [Github issues section](https://github.com/MRVDH/picnic-web/issues) or email me at [info@maartenvandenhoven.com](mailto:info@maartenvandenhoven.com).

#### How do I run a local instance?
Clone or download the repo, run `npm install` in both the main directory and the `./client` directory. Then open two terminals. In the first terminal open the main directory and run `node app.js`, and in the other terminal open the `./client` directory and run `npm run serve`.