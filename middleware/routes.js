import PicnicClient from "picnic-api";

function buildPicnicClient(req) {
    return new PicnicClient({
        authKey: req.get("x-picnic-auth")
    });
}

export default {
    async setUpRouting(app) {
        app.post("/api/login", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            await picnicClient.login(req.body.username, req.body.password);

            res.send({ authKey: picnicClient.authKey });
        });

        app.get("/api/lists/:depth", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            res.send(await picnicClient.getLists(req.params.depth));
        });

        app.post("/api/lists", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            res.send(await picnicClient.getList(req.body.listId, req.body.subListId, req.body.depth));
        });
        
        app.get("/api/categories/:depth", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            res.send((await picnicClient.getCategories(req.params.depth || 0)).catalog);
        });
        
        app.post("/api/suggestions", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            res.send(await picnicClient.getSuggestions(req.body.query));
        });
        
        app.post("/api/search", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            res.send(await picnicClient.search(req.body.query));
        });
        
        app.get("/api/cart", async (req, res) => {
            let picnicClient = buildPicnicClient(req);

            res.send(await picnicClient.getShoppingCart());
        });
    }
}