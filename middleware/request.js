import rateLimit from "express-rate-limit";

export default {
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