<template>
    <div id="app">
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
            
        <b-icon
            class="icon-info"
            icon="exclamation-circle"
            @click="showInfoModal = true"
            />

        <b-modal
            v-model="showInfoModal"
            title="Over Picnic Web"
            :hide-footer="true"
            >
            <p>
                Picnic Web is een onofficiële web interface voor de online supermarkt Picnic. De broncode is te vinden op GitHub:
                <a
                    href="https://github.com/MRVDH/picnic-web" 
                    target="_blank"
                    >https://github.com/MRVDH/picnic-web</a>.
            </p>
            
            <h5>Privacy</h5>

            <p>
                Picnic Web plaatst geen cookies. Op de backend (server) worden geen logs, IP-adressen of andere gegevens bijgehouden. Requests tussen de Picnic Web frontend en de Picnic Web backend en requests tussen de Picnic Web Backend en de officiële Picnic servers worden via HTTPS verstuurd. Na het inloggen wordt er alleen een authenticatietoken in de browser van de gebruiker via Local Storage opgeslagen om data op te vragen van picnic, vergelijkbaar met de werking van de officiële app.
            </p>
        </b-modal>

        <b-container>
            <CustomHeader />
            <b-row>
                <b-col cols="9">
                    <b-badge
                        variant="primary"
                        >
                        <h2 @click="goToStorePage()">Picnic Web</h2>
                    </b-badge>
                    <span
                        class="unofficial-text"
                        @click="showInfoModal = true"
                        >
                        Onofficieel
                    </span>
                </b-col>
            </b-row>
            <CustomLogin v-if="!loggedIn" />
            <router-view />
        </b-container>
    </div>
</template>

<script>
import CustomHeader from '@/components/Header';
import CustomLogin from '@/components/Login';

import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

export default {
    name: 'App',
    components: {
        CustomHeader,
        CustomLogin
    },
    data () {
        return {
            showInfoModal: false
        }
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
        },
        goToStorePage () {
            this.$router.push("/");
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
    cursor: pointer;
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
    cursor: pointer;
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

.icon-info {
    position: fixed;
    top: 92px;
    left: 18px;
    font-size: 26px;
    color: #666;
    cursor: pointer;
}
</style>
