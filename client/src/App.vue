<template>
    <div id="app">
        <CustomLoginModal />

        <b-container>
            <CustomHeader />
            <b-row>
                <b-col cols="6">
                    <b-badge
                        variant="primary"
                        >
                        <h2>Picnic Web</h2>
                    </b-badge>
                </b-col>
            </b-row>
            <router-view />
        </b-container>
    </div>
</template>

<script>
import CustomHeader from '@/components/Header';
import CustomLoginModal from '@/components/LoginModal';

import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

export default {
    name: 'App',
    components: {
        CustomHeader,
        CustomLoginModal
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
        },
        cart: {
            get () {
                return this.$store.state.cart;
            },
            set (cart) {
                this.$store.commit(SET_CART, cart);
            }
        }
    },
    watch: {
        loggedIn () {
            if (this.loggedIn) {
                this.getCartContents();
            }
        }
    },
    mounted () {
        if (this.loggedIn) {
            this.getCartContents();
        }
    },
    methods: {
        getCartContents () {
            ApiService.getShoppingCart().then(res => {
                this.cart = res.data;
            });
        }
    }
}
</script>

<style>
.container {
    margin-top: 20px;
    margin-bottom: 20px;
}

.badge h2 {
    margin: 0;
    line-height: 1;
    cursor: default;
}

.row {
    margin-bottom: 20px;
}
</style>
