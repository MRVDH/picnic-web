<template>
    <b-row v-if="user">
        <b-col cols="6">
            <h3>Profiel</h3>

            <p class="info-title">Naam</p>
            <p class="info-value">{{ user.firstname }} {{ user.lastname }}</p>
            <p class="info-title">Telefoonnummer</p>
            <p class="info-value">{{ user.phone }}</p>
            <p class="info-title">E-mailadres</p>
            <p class="info-value">{{ user.contact_email }}</p>
            <p class="info-title">Bezorgadres</p>
            <p class="info-value">{{ user.address.street }} {{ user.address.house_number }}{{ user.address.house_number_ext }}, {{ user.address.postcode }} {{ user.address.city }}</p>
            <p class="info-title">Jouw thuis</p>
            <p class="info-value">Volwassenen: {{ user.household_details.adults }}, kinderen: {{ user.household_details.children }}, katten: {{ user.household_details.cats }}, honden: {{ user.household_details.dogs }}</p>

            <h3>Abonnementen</h3>

            <div
                v-for="sub in user.subscriptions"
                :key="sub.list_id"
                >
                <p class="info-title">{{ sub.name }}</p>
                <p class="info-value">{{ sub.subscribed ? 'Ingeschreven' : 'Uitgeschreven' }}</p>
            </div>

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
        </b-col>
        <b-col cols="6">
            <h3>Bestellingen</h3>
            <p>Totaal: {{ user.completed_deliveries }}</p>
        </b-col>
    </b-row>
</template>

<script>
import ApiService from '@/services/ApiService';

export default {
    name: 'Settings',
    data () {
        return {
            user: null,
            consentSettings: null
        }
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
        },
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
        },
        consentChange (consentId, newVal) {
            ApiService.setConsent(consentId, newVal);
        }
    }
}
</script>

<style scoped lang="scss">
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
</style>
