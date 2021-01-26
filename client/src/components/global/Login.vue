<template>
    <b-row>
        <b-col>
            <b-button
                variant="primary"
                @click="visible = !visible"
                >
                Inloggen
                <b-icon :icon="visible ? 'chevron-up' : 'chevron-down'" />
            </b-button>
            <span class="logged-out-info-text">
                Log in om je winkelmand en account te beheren.
            </span>
            <b-collapse
                id="collapse-login"
                v-model="visible"
                >
                <b-card>
                    <form ref="form">
                        <p>
                            Nog geen Picnic account? Download de app, registreer en gebruik code <a
                                href="https://picnic.app/nl/vriendenkorting/MAAR3267"
                                target="_blank"
                                >MAAR3267</a> voor € 5,00 korting op de eerste bestelling voor jou en de auteur van Picnic Web. 😄
                        </p>
                        
                        <b-form-group
                            label="Email"
                            label-for="email-input"
                            >
                            <b-form-input
                                id="email-input"
                                v-model="email"
                                required
                                />
                        </b-form-group>

                        <b-form-group
                            label="Wachtwoord"
                            label-for="password-input"
                            >
                            <b-form-input
                                id="password-input"
                                v-model="password"
                                type="password"
                                required
                                />
                        </b-form-group>

                        <span
                            v-if="loginError"
                            class="text-primary"
                            >
                            Er is een fout opgetreden tijdens het inloggen.
                        </span>

                        <b-button
                            variant="primary"
                            class="float-right"
                            :disabled="!email || !password"
                            @click="submitLogin()"
                            >
                            Inloggen
                        </b-button>
                    </form>
                </b-card>
            </b-collapse>
        </b-col>
    </b-row>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_AUTH_KEY } from '@/store/mutationTypes';

export default {
    name: 'Login',
    data () {
        return {
            email: "",
            password: "",
            loginError: false,
            visible: false
        }
    },
    computed: {
        authKey: {
            get () {
                return this.$store.state.authKey;
            },
            set (val) {
                this.$store.commit(SET_AUTH_KEY, val);
            }
        }
    },
    methods: {
        submitLogin () {
            if (!this.email || !this.password) {
                return;
            }

            this.loginError = false;
            ApiService.login(this.email, this.password).then((res) => {
                this.authKey = res.data.authKey;
            }).catch(() => {
                this.loginError = true;
            });
        }
    }
}
</script>

<style scoped lang="scss">
.card {
    margin-top: 10px;

    a {
        font-weight: 500;
    }
}

.b-card {
    background: #FFF;
    padding: 20px;
}

.logged-out-info-text {
    padding-left: 10px;
}

form {
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
}
</style>
