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

            res.send((await picnicClient.getCategories(req.params.depth || 0)));
        });

        // app.post("/api/osm/oauth/request", osmController.getRequestToken);
        // app.get("/api/osm/oauth/callback", osmController.doRequestTokenCallback);
        // app.get("/api/osm/oauth/isauthenticated", osmController.getIsAuthenticated);
        // app.post("/api/osm/oauth/logout", osmController.doLogout);
        // app.get("/api/osm/getuserdetails", osmController.getUserDetails);

        // app.get("/api/sector", sectorController.getAll);
        // app.put("/api/sector/:id", sectorController.update);
        // app.get("/api/sector/sectorset/:sectorSetId", sectorController.getBySectorSetId);
        // app.get("/api/sector/generate/:id", sectorController.generateGpxBySectorId);
        // app.get('/api/sector/split/:id', sectorController.splitSectorBySectorId);
        // app.delete('/api/sector/:id', sectorController.delete);

        // app.get("/api/sectorset/iteration/:id", sectorSetController.getAllSectorSetsByIterationId);
        // app.put("/api/sectorset/recount/:id", sectorSetController.recountSectorSetCounts);

        // app.get("/api/state", stateController.getAll);

        // app.post("/api/event/add", eventController.add);
        // app.get("/api/event/all/:amount", eventController.getAll);
        // app.get("/api/event/sectorid/:id", eventController.getBySectorId);

        // app.get('/api/iteration/current', iterationController.getCurrentIteration);

        // app.get('/api/pointofinterest', pointOfInterestController.getAllPointOfInterests);
    }
}