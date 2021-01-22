<template>
    <b-row>
        <b-col>
            <b-button
                :class="{ 'margin-bottom': visible }"
                variant="primary"
                @click="visible = !visible"
                >
                Inloggen
                <b-icon :icon="visible ? 'chevron-up' : 'chevron-down'" />
            </b-button>
            <span
                class="logged-out-info-text"
                :class="{ 'vertical-align': visible }"
                >
                Je bent op dit moment uitgelogd. Login om je winkelmand en account te beheren.
            </span>
            <b-collapse
                id="collapse-login"
                v-model="visible"
                >
                <b-card>
                    <form ref="form">
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

<style scoped>
.b-card {
    background: #FFF;
    padding: 20px;
}

.margin-bottom {
    margin-bottom: 10px;
}

.logged-out-info-text {
    padding-left: 20px;
}

.vertical-align {
    vertical-align: text-bottom;
}

form {
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
}
</style>
