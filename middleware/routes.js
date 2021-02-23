import picnicController from "./picnicController.js";

export default {
    async setUpRouting(app) {
        app.post("/api/login", picnicController.login);
        app.get("/api/lists/:depth", picnicController.getLists);
        app.post("/api/lists", picnicController.getList);
        app.get("/api/categories/:depth", picnicController.getCategories);
        app.post("/api/suggestions", picnicController.getSuggestions);
        app.post("/api/search", picnicController.search);
        app.get("/api/cart", picnicController.getShoppingCart);
        app.post("/api/cart/add", picnicController.addProductToShoppingCart);
        app.post("/api/cart/remove", picnicController.removeProductFromShoppingCart);
        app.get("/api/product/:productId", picnicController.getProduct);
        app.post("/api/slot", picnicController.setDeliverySlot);
        app.get("/api/user", picnicController.getUserDetails);
        app.get("/api/consent", picnicController.getConsentSettings);
        app.post("/api/consent", picnicController.setConsentSettings);
        app.get("/api/discount", picnicController.getMgmDetails);
        app.get("/api/deliveries", picnicController.getDeliveries);
        app.get("/api/delivery/:deliveryId", picnicController.getDelivery);
    }
}