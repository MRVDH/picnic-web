import Vue from 'vue';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';

import '@/assets/custom-vars.scss';

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');
