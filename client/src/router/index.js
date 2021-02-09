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
    },
    {
        path: '/delivery/:deliveryId',
        name: 'Delivery',
        component: () => import(/* webpackChunkName: "delivery" */ '../components/routes/Delivery.vue')
    }
];

const router = new VueRouter({
    routes,
    scrollBehavior (to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { x: 0, y: 0 }
        }
    }
});

export default router;
