import axios from "axios";
import store from "@/store";

let baseURL = window.location.hostname === "localhost" ? "http://localhost:8081" : ("https://" + window.location.hostname);

let httpInstance = axios.create({ baseURL });

httpInstance.interceptors.request.use((config) => {
    if (store.state.authKey) {
        config.headers["x-picnic-auth"] = store.state.authKey;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default {
    login (username, password) {
        return httpInstance.post(`/api/login`, { username, password });
    },
    getLists (depth = 0) {
        return httpInstance.get(`/api/lists/${depth}`);
    },
    getList (listId, subListId = null, depth = 0) {
        return httpInstance.post(`/api/lists`, { listId, subListId, depth });
    },
    populateList (list) {
        return httpInstance.post(`/api/lists/populate`, { list });
    },
    getCategories (depth = 0) {
        return httpInstance.get(`/api/categories/${depth}`);
    },
    getSuggestions (query) {
        return httpInstance.post(`/api/suggestions`, { query });
    },
    search (query) {
        return httpInstance.post(`/api/search`, { query });
    },
    getShoppingCart () {
        return httpInstance.get(`/api/cart`);
    },
    addProductToCart (productId) {
        return httpInstance.post(`/api/cart/add`, { productId });
    },
    removeProductFromCart (productId) {
        return httpInstance.post(`/api/cart/remove`, { productId });
    },
    getProductDetails (productId) {
        return httpInstance.get(`/api/product/${productId}`);
    },
    setDeliverySlot (slotId) {
        return httpInstance.post(`/api/slot`, { slotId });
    },
    getUserDetails () {
        return httpInstance.get(`/api/user`);
    },
    getConsentSettings () {
        return httpInstance.get(`/api/consent`);
    },
    setConsent (consentId, newVal) {
        return httpInstance.post(`/api/consent`, { consentId, newVal });
    },
    getDiscount () {
        return httpInstance.get(`/api/discount`);
    },
    getDeliveries () {
        return httpInstance.get(`/api/deliveries`);
    },
    getDelivery (deliveryId) {
        return httpInstance.get(`/api/delivery/${deliveryId}`);
    },
    getDeliveryLocationData (deliveryId) {
        return httpInstance.get(`/api/delivery/location/${deliveryId}`);
    }
}