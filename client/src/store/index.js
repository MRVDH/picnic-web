import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';
import * as mt from './mutationTypes';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        authKey: null
    },
    mutations: {
        [mt.SET_AUTH_KEY] (state, authKey) {
            state.authKey = authKey;
        }
    },
    actions: {
        [mt.SET_AUTH_KEY] ({ commit }, authKey) {
            commit(mt.SET_AUTH_KEY, authKey);
        }
    },
    plugins: [ new VuexPersistence({
        storage: window.localStorage,
        reducer: (state) => ({
            authKey: state.authKey,
        }),
    }).plugin ]
});
