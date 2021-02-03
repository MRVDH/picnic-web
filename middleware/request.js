import rateLimit from "express-rate-limit";
import morgan from "morgan"; 

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
        return (req, res, next) => {
            if (!req.originalUrl.includes('/api/', 0)) {
                res.sendFile(`${dirname}/dist/index.html`);
            } else {
                next();
            }
        };
    }
}