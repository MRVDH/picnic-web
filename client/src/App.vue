<template>
    <div id="app">
        <CustomLoginModal />
        <a
            href="https://github.com/MRVDH/picnic-web"
            target="_blank"
            >
            <b-icon
                class="icon-github"
                icon="github"
                />
        </a>
            
        <a
            href="https://maartenvandenhoven.com"
            target="_blank"
            >
            <b-icon
                class="icon-website"
                icon="globe"
                />
        </a>

        <b-container>
            <CustomHeader />
            <b-row>
                <b-col cols="9">
                    <b-badge
                        variant="primary"
                        >
                        <h2>Picnic Web</h2>
                    </b-badge>
                    <span class="unofficial-text">Onofficieel</span>
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

<style scoped>
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

.unofficial-text {
    color: #666;
    font-weight: 500;
    position: absolute;
    padding-top: 7px;
    padding-left: 10px;
}

.icon-github {
    position: fixed;
    top: 18px;
    left: 18px;
    font-size: 26px;
    color: #666;
    cursor: pointer;
}

.icon-website {
    position: fixed;
    top: 55px;
    left: 18px;
    font-size: 26px;
    color: #666;
    cursor: pointer;
}
</style>
