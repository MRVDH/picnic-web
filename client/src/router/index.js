import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'StoreFront',
        component: () => import(/* webpackChunkName: "store-front" */ '../components/StoreFront.vue')
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import(/* webpackChunkName: "search" */ '../components/Search.vue')
    },
    {
        path: '/cart',
        name: 'Cart',
        component: () => import(/* webpackChunkName: "cart" */ '../components/ShoppingCart.vue')
    },
    {
        path: '/product/:productId',
        name: 'Product',
        component: () => import(/* webpackChunkName: "product-details" */ '../components/ProductDetails.vue')
    },
    {
        path: '/user',
        name: 'User',
        component: () => import(/* webpackChunkName: "settings" */ '../components/Settings.vue')
    }
];

const router = new VueRouter({
    routes
});

export default router;
