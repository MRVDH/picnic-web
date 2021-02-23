import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/', 
        redirect: '/store/front'
    },
    {
        path: '/store/front/:listId?',
        name: 'StoreFront',
        component: () => import(/* webpackChunkName: "store-front" */ '../components/routes/StoreFront.vue')
    },
    {
        path: '/store/search',
        name: 'Search',
        component: () => import(/* webpackChunkName: "search" */ '../components/routes/Search.vue')
    },
    {
        path: '/store/search/query/:query?',
        name: 'SearchQuery',
        component: () => import(/* webpackChunkName: "search" */ '../components/routes/Search.vue')
    },
    {
        path: '/store/search/list/:listId?/:subListId?',
        name: 'SearchList',
        component: () => import(/* webpackChunkName: "search" */ '../components/routes/Search.vue')
    },
    {
        path: '/store/cart',
        name: 'Cart',
        component: () => import(/* webpackChunkName: "cart" */ '../components/routes/ShoppingCart.vue')
    },
    {
        path: '/store/product/:productId',
        name: 'Product',
        component: () => import(/* webpackChunkName: "product-details" */ '../components/routes/ProductDetails.vue')
    },
    {
        path: '/store/user',
        name: 'User',
        component: () => import(/* webpackChunkName: "settings" */ '../components/routes/Settings.vue')
    },
    {
        path: '/store/delivery/:deliveryId',
        name: 'Delivery',
        component: () => import(/* webpackChunkName: "delivery" */ '../components/routes/Delivery.vue')
    }
];

const router = new VueRouter({
    mode: 'history',
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
