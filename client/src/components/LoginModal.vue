<template>
    <b-modal
        id="login-modal"
        v-model="loginModalOpen"
        title="Login"
        ok-title="Inloggen"
        :no-close-on-backdrop="true"
        :no-close-on-esc="true"
        :ok-only="true"
        :hide-header="true"
        :hide-footer="true"
        >
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

            <b-button
                variant="primary"
                class="float-right"
                :disabled="!email || !password"
                @click="submitLogin()"
                >
                Inloggen
            </b-button>
        </form>
    </b-modal>
</template>

<script>
import { SET_AUTH_KEY } from '@/store/mutationTypes';
import ApiService from '@/services/ApiService';

export default {
    name: 'LoginModal',
    data () {
        return {
            loginModalOpen: false,
            email: "",
            password: "",
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
    mounted () {
        if (!this.authKey) {
            this.loginModalOpen = true;
        }
    },
    methods: {
        submitLogin () {
            if (!this.email || !this.password) {
                return;
            }

            ApiService.login(this.email, this.password).then((res) => {
                this.authKey = res.data.authKey;
                this.loginModalOpen = false;
            }).catch(() => {

            });
        }
    }
}
</script>

<style scoped>
</style>
