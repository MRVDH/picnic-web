import PicnicClient from "picnic-api";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import fs from "fs";
import cheerio from "cheerio";

async function buildFinalHtml(dirname, req, title, description = null, image = null) {
    const baseHTML = (await fs.promises.readFile(`${dirname}/dist/index.html`)).toString();
    const $ = cheerio.load(baseHTML);

    $('meta[property="og:url"]').attr('content', `https://${req.get('host')}${req.originalUrl}`);
    $('meta[property="og:title"]').attr('content', title);
    
    if (image) {
        $('meta[property="og:image"]').attr('content', image);
    }

    if (description) {
        $('meta[property="og:description"]').attr('content', description);
    }

    return $.html();
}

async function applyProductMetaTags(req, res, dirname) {
    let picnicClient = new PicnicClient({ authKey: process.env.AUTH_KEY });

    let productId = req.originalUrl.split("product/")[1];
    let product = null;

    try {
        product = await picnicClient.getProduct(productId);
    } catch {
        return null;
    }

    let title = `${product.product_details.name} - Picnic Web (onofficieel)`;
    let image = `https://storefront-prod.nl.picnicinternational.com/static/images/${product.product_details.image_id}/large.png`;

    let finalHtml = await buildFinalHtml(dirname, req, title, product.product_details.description, image);

    return finalHtml;
}  

export default {
    logging () {
        // Waiting for color status to be implemented: https://github.com/expressjs/morgan/issues/186
        morgan.token(`status`, (req, res) => {
            const status = (typeof res.headersSent !== `boolean`
            ? Boolean(res._header)
            : res.headersSent)
              ? res.statusCode
              : undefined
          
            // get status color
            const color =
              status >= 500
                ? 31 // red
                : status >= 400
                ? 33 // yellow
                : status >= 300
                ? 36 // cyan
                : status >= 200
                ? 32 // green
                : 0 // no color
            return `\x1b[${color}m${status}\x1b[0m`
        });

        return morgan("[:date[clf]] :status :method :url", {
            skip: (req, res) => {
                if (req.method === "OPTIONS") {
                    return true;
                }

                if (!req.originalUrl.startsWith("/api/")) {
                    return true;
                }

                return false;
            }
        });
    },
    cors (req, res, next) {
        var allowedOrigins = ['http://localhost:8080', 'http://localhost:8081', 'https://www.openstreetmap.org', 'https://www.mapwith.ai'];

        var origin = req.headers.origin;
        
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-picnic-auth');
        res.header('Access-Control-Allow-Credentials', true);

        return next();
    },
    rateLimit () {
        let maxRequests = 200;

        try {
            maxRequests = parseInt(process.env.MAX_REQUESTS)
        } catch { }

        return rateLimit({
            windowMs: 10 /* <= amount of minutes */ * 60 * 1000,
            max: maxRequests
        });
    },
    filterNonApiRequests (dirname) {
        return async (req, res, next) => {
            try {
                if (req.originalUrl.startsWith("/store/product/")) {
                    let html = await applyProductMetaTags(req, res, dirname);

                    if (!html) {
                        res.sendFile(`${dirname}/dist/index.html`);
                        return;
                    }

                    res.send(html);
                } else if (req.originalUrl.startsWith("/store") || req.originalUrl === "" || req.originalUrl === "/") {
                    res.sendFile(`${dirname}/dist/index.html`);
                } else {
                    next();
                }
            } catch {
                res.sendFile(`${dirname}/dist/index.html`);
            }
        };
    }
}