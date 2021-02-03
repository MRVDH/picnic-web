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
            <CustomHeader
                class="d-none d-md-block"
                />
            <b-row>
                <b-col cols="9">
                    <b-badge variant="primary">
                        <a href="#/">
                            <h2>Picnic Web</h2>
                        </a>
                    </b-badge>
                    <span
                        class="unofficial-text"
                        @click="showInfoModal = true"
                        >
                        Onofficieel
                    </span>
                </b-col>
            </b-row>
            <b-row class="d-sm-block d-md-none">
                <b-col cols="12">
                    <b-card>
                        <h4 style="text-align: center; margin-bottom: 1rem;">Welkom!</h4> 
                        Picnic Web is gebouwd voor grotere schermen (tablets, laptops, desktops, etc). Open Picnic Web op een groter scherm, of <a
                            href="https://picnic.app/nl/deeplink/?path=winkel/purchases"
                            style="font-weight: 500;"
                            >open de officiële Picnic app</a>.
                    </b-card>
                </b-col>
            </b-row>
            <CustomLogin
                v-if="!loggedIn"
                class="d-none d-md-block"
                />
            <router-view />
        </b-container>
    </div>
</template>

<script>
import CustomHeader from '@/components/global/Header';
import CustomLogin from '@/components/global/Login';

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
        }
    }
}
</script>

<style scoped>
.container {
    margin-top: 20px;
    margin-bottom: 20px;
}

.badge h2, .badge a {
    margin: 0;
    line-height: 1;
    cursor: pointer;
    color: white;
    text-decoration: none;
}

.badge h2:hover, .badge a:hover {
    color: white;
    text-decoration: none;
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
    right: 18px;
    bottom: 18px;
    font-size: 26px;
    color: #666;
    cursor: pointer;
}

.icon-website {
    position: fixed;
    right: 55px;
    bottom: 18px;
    font-size: 26px;
    color: #666;
    cursor: pointer;
}

.icon-info {
    position: fixed;
    right: 92px;
    bottom: 18px;
    font-size: 26px;
    color: #666;
    cursor: pointer;
}
</style>
