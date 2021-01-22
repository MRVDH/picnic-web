import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'StoreFront',
        component: () => import(/* webpackChunkName: "store-front" */ '../components/routes/StoreFront.vue')
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import(/* webpackChunkName: "search" */ '../components/routes/Search.vue')
    },
    {
        path: '/cart',
        name: 'Cart',
        component: () => import(/* webpackChunkName: "cart" */ '../components/routes/ShoppingCart.vue')
    },
    {
        path: '/product/:productId',
        name: 'Product',
        component: () => import(/* webpackChunkName: "product-details" */ '../components/routes/ProductDetails.vue')
    },
    {
        path: '/user',
        name: 'User',
        component: () => import(/* webpackChunkName: "settings" */ '../components/routes/Settings.vue')
    }
];

const router = new VueRouter({
    routes
});

export default router;
