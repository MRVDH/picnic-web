<template>
    <b-row
        v-if="user && loggedIn"
        class="d-none d-md-flex"
        >
        <b-col cols="6">
            <h3>
                Profiel
                <b-button
                    variant="primary"
                    size="sm"
                    @click="logout()"
                    >
                    Uitloggen
                </b-button>
            </h3>

            <p class="info-title">Naam</p>
            <p class="info-value">{{ user.firstname }} {{ user.lastname }}</p>
            <p class="info-title">Telefoonnummer</p>
            <p class="info-value">
                <a
                    id="sp1"
                    class="spoiler"
                    href="#sp1"
                    >{{ user.phone }}</a>
            </p>
            <p class="info-title">E-mailadres</p>
            <p class="info-value">
                <a
                    id="sp2"
                    class="spoiler"
                    href="#sp2"
                    >{{ user.contact_email }}</a>
            </p>
            <p class="info-title">Bezorgadres</p>
            <p class="info-value">
                <a
                    id="sp3"
                    class="spoiler"
                    href="#sp3"
                    >{{ user.address.street }} {{ user.address.house_number }}{{ user.address.house_number_ext }}, {{ user.address.postcode }} {{ user.address.city }}</a>
            </p>
            <p class="info-title">Jouw thuis</p>
            <p class="info-value">Volwassenen: {{ user.household_details.adults }}, kinderen: {{ user.household_details.children }}, katten: {{ user.household_details.cats }}, honden: {{ user.household_details.dogs }}</p>

            <div v-if="discount">
                <h3>Vriendenkorting</h3>

                <p class="info-title">Kortingscode</p>
                <p class="info-value">{{ discount.mgm_code }}</p>

                <p class="info-title">Kortings-URL</p>
                <p class="info-value">{{ discount.share_url }}</p>

                <p class="info-title">Totaal verdiend</p>
                <p class="info-value">{{ new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(discount.amount_earned / 100) }}</p>

                <p class="info-title">Kortingswaarde</p>
                <p class="info-value">{{ new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(discount.inviter_value / 100) }}</p>
            </div>

            <h3>Abonnementen</h3>

            <div
                v-for="sub in user.subscriptions"
                :key="sub.list_id"
                >
                <p class="info-title">{{ sub.name }}</p>
                <p class="info-value">{{ sub.subscribed ? 'Ingeschreven' : 'Uitgeschreven' }}</p>
            </div>

            <div v-if="consentSettings">
                <h3>Privacy</h3>

                <div
                    v-for="consentSetting in consentSettings"
                    :key="consentSetting.id"
                    class="consent-option"
                    >
                    <b-form-checkbox
                        v-model="consentSetting.established_decision"
                        switch
                        @change="consentChange(consentSetting.text_id, consentSetting.established_decision)"
                        >
                        {{ consentSetting.text.title }}
                    </b-form-checkbox>
                    <p class="info-title">{{ consentSetting.text.text }} {{ consentSetting.text.dissent_text }}</p>
                </div>
            </div>
        </b-col>
        <b-col cols="6">
            <h3>Bestellingen</h3>

            <div v-if="user.completed_deliveries && deliveries && deliveries.length">
                <p>Je hebt <strong>{{ amountOfDeliveries }}</strong> afgeleverde bestellingen voor totaal <strong>{{ totalDeliveryCosts }}</strong>.</p>

                <div
                    v-for="delivery in deliveries"
                    :key="delivery.id"
                    class="delivery-row"
                    >
                    <router-link :to="{ name: 'Delivery', params: { deliveryId: delivery.id }}">
                        <div class="delivery-block">
                            <span
                                v-if="delivery.status === 'CURRENT' && new Date(delivery.slot.window_end) > new Date()"
                                class="current-delivery text-success"
                                >
                                Lopende bestelling
                            </span>
                            <br v-if="delivery.status === 'CURRENT' && new Date(delivery.slot.window_end) > new Date()">
                            <span
                                class="delivery-title"
                                >
                                {{ getDayName(delivery) }} {{ getDayDate(delivery) }}
                            </span>
                            <br>
                            <span
                                class="delivery-price"
                                >
                                {{ getTotalDeliveryPrice(delivery) }}
                            </span>
                            <b-icon
                                class="float-right"
                                icon="chevron-right"
                                font-scale="0.8"
                                />
                        </div>
                    </router-link>
                </div>
            </div>
            <b-skeleton v-if="!deliveries" />
            <p v-if="deliveries && !deliveries.length">Nog bestellingen geplaatst.</p>
        </b-col>
    </b-row>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_AUTH_KEY } from '@/store/mutationTypes';

export default {
    name: 'Settings',
    data () {
        return {
            user: null,
            consentSettings: null,
            discount: null,
            deliveries: null
        }
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
        },
        amountOfDeliveries () {
            if (this.deliveries?.length > 0) {
                return this.deliveries.filter(x => x.delivery_time && new Date(x.delivery_time.end) < new Date()).length;
            } else {
                return 0;
            }
        },
        totalDeliveryCosts () {
            let totals = 0;

            if (this.deliveries?.length > 0) {
                for (let delivery of this.deliveries) {
                    let totalPrice = 0;

                    for (let order of delivery.orders) {
                        totalPrice += order.total_price / 100;
                    }

                    totals += totalPrice;
                }

            }

            return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(totals);
        }
    },
    watch: {
        loggedIn () {
            if (this.loggedIn) {
                this.getUserDetails();
            }
        }
    },
    mounted () {
        if (this.loggedIn) {
            this.getUserDetails();
        }
    },
    methods: {
        getUserDetails () {
            ApiService.getUserDetails().then(res => {
                this.user = res.data;
            });
            ApiService.getConsentSettings().then(res => {
                this.consentSettings = res.data;
            });
            ApiService.getDiscount().then(res => {
                this.discount = res.data;
            });
            ApiService.getDeliveries().then(res => {
                this.deliveries = res.data;
            });
        },
        consentChange (consentId, newVal) {
            ApiService.setConsent(consentId, newVal);
        },
        getDayName (delivery) {
            let date = new Date(delivery.slot.window_start);
            
            let name = date.toLocaleDateString("nl-NL", { weekday: 'long' });
            name = name.charAt(0).toUpperCase() + name.slice(1);
            
            return name;
        },
        getDayDate (delivery) {
            let date = new Date(delivery.slot.window_start);
            
            let name = date.toLocaleDateString("nl-NL", { month: 'long' });
            
            return `${date.getDate()} ${name.substring(0, 3)}`;
        },
        getTotalDeliveryPrice (delivery) {
            let totalPrice = 0;

            for (let order of delivery.orders) {
                totalPrice += order.total_price / 100;
            }

            return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(totalPrice);
        },
        logout () {
            this.$store.dispatch(SET_AUTH_KEY, null);
            location.reload();
        }
    }
}
</script>

<style scoped lang="scss">
.row {
    background: white;
    padding: 20px;
}

.col-6 {
    padding-left: 7px;
    padding-right: 7px;
}

button {
    margin-top: -6px;
}

.info-title {
    color: #999;
    font-size: 12px;
    margin-bottom: 0;
}

.consent-option:not(:last-child) {
    margin-bottom: 15px;
}

.custom-switch {
    margin-bottom: 10px
}

.delivery-row {
    padding: 10px 0;

    &:not(:last-child) {
        border-bottom: 1px solid #EEE;
    }
}

.delivery-block {
    display: inline-block;
    font-size: 15px;
    width: 100%;
    cursor: pointer;

    span {
        color: #333;

        &.delivery-price {
            color: #999;
        }
    }

    .b-icon {
        margin-top: -5px;
    }
}

.b-skeleton-text {
    width: 250px;
    height: 24px;
}

.spoiler {
    background: #333333;
    border-radius: 0.2em;
    color: transparent;

    &:target {
        background: transparent;
        color: inherit;
    }
}
</style>
