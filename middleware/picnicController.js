import PicnicClient from "picnic-api";
import dotenv from 'dotenv';

dotenv.config();

function buildPicnicClient(req, allowAnonymous = false) {
    let authKey = req.get("x-picnic-auth");

    if (!authKey && allowAnonymous) {
        authKey = process.env.AUTH_KEY;
    }

    return new PicnicClient({ authKey });
}

export default {
    async login(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            await picnicClient.login(req.body.username, req.body.password);

            res.send({ authKey: picnicClient.authKey });
        } catch {
            res.sendStatus(500);
        }
    },
    async getLists(req, res) {
        let picnicClient = buildPicnicClient(req, true);

        try {
            let lists = await picnicClient.getLists(req.params.depth);

            if (req.get("x-picnic-auth")) {
                res.send(lists);
            } else {
                res.send(lists.filter(x => x.id !== "purchases"));
            }
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getList(req, res) {
        let picnicClient = buildPicnicClient(req, true);

        try {
            res.send(await picnicClient.getList(req.body.listId, req.body.subListId, req.body.depth));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getCategories(req, res) {
        let picnicClient = buildPicnicClient(req, true);

        try {
            let categories = (await picnicClient.getCategories(req.params.depth || 0)).catalog;

            if (req.get("x-picnic-auth")) {
                res.send(categories);
            } else {
                res.send(categories.filter(x => x.id !== "purchases"));
            }
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getSuggestions(req, res) {
        let picnicClient = buildPicnicClient(req, true);

        try {
            res.send(await picnicClient.getSuggestions(req.body.query));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async search(req, res) {
        let picnicClient = buildPicnicClient(req, true);

        try {
            res.send(await picnicClient.search(req.body.query));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getShoppingCart(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.getShoppingCart());
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async addProductToShoppingCart(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.addProductToShoppingCart(req.body.productId, 1));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async removeProductFromShoppingCart(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.removeProductFromShoppingCart(req.body.productId, 1));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getProduct(req, res) {
        let picnicClient = buildPicnicClient(req, true);

        try {
            res.send(await picnicClient.getProduct(req.params.productId));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async setDeliverySlot(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.setDeliverySlot(req.body.slotId));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getUserDetails(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.getUserDetails());
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getConsentSettings(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.getConsentSettings());
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async setConsentSettings(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.setConsentSettings([{ consent_request_text_id: req.body.consentId, consent_request_locale: 'nl_NL', agreement: req.body.newVal }]));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getMgmDetails(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.getMgmDetails());
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getDeliveries(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.getDeliveries());
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    },
    async getDelivery(req, res) {
        let picnicClient = buildPicnicClient(req);

        try {
            res.send(await picnicClient.getDelivery(req.params.deliveryId));
        } catch (err) {
            res.sendStatus(err?.response?.status || 500);
        }
    }
}