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
    getCategories (depth) {
        return httpInstance.get(`/api/categories/${depth}`);
    }
}