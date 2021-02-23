<template>
    <b-list-group
        v-if="loggedIn"
        class="d-none d-md-block"
        >
        <b-list-group-item
            class="delivery-date"
            >
            <a href="/store/user">
                <b-icon
                    icon="arrow-left-short"
                    font-scale="1.5"
                    />
            </a>
            {{ getDayName(delivery) }} {{ getDayDate(delivery) }}
        </b-list-group-item>

        <div v-if="items.length">
            <CustomShoppingCartItem
                v-for="item in items"
                :key="item.id"
                :product="item"
                :unavailable="false"
                :quantity-alterable="false"
                />
        </div>

        <CustomTotals
            v-if="delivery && delivery.total_price"
            :show-checkout="false"
            :savings="delivery.total_savings"
            :price="delivery.total_price"
            />
    </b-list-group>
</template>

<script>
import ApiService from '@/services/ApiService';
import DataConverterService from '@/services/DataConverterService';

import CustomShoppingCartItem from '@/components/others/ShoppingCartItem';
import CustomTotals from '@/components/others/Totals';

export default {
    name: 'Delivery',
    components: {
        CustomShoppingCartItem,
        CustomTotals
    },
    data () {
        return {
            delivery: null,
            items: []
        }
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
        }
    },
    watch: {
        loggedIn () {
            if (this.loggedIn) {
                this.getDeliveryDetails();
            }
        }
    },
    mounted () {
        if (this.loggedIn) {
            this.getDeliveryDetails();
        }
    },
    methods: {
        getDeliveryDetails () {
            ApiService.getDelivery(this.$route.params.deliveryId).then(res => {
                this.delivery = res.data;
                this.processDeliveryContents();
            });
        },
        processDeliveryContents () {
            this.items = [];

            this.delivery.total_savings = 0;
            this.delivery.total_price = 0;

            for (let order of this.delivery.orders) {
                order = DataConverterService.processCartContents(order);

                for (let item of order.items) {
                    for (let i = 0; i < item.items.length; i++) {
                        let subItem = item.items[i];

                        subItem._quantitySelectOpen = false;

                        if (item.price) {
                            this.items.push(subItem);
                        }
                    }
                }

                this.delivery.total_savings += order.total_savings;
                this.delivery.total_price += order.total_price;
            }
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
    }
}
</script>

<style scoped lang="scss">
.delivery-date {
    text-align: center;
    font-size: 20px;
    font-weight: 500;
}

.b-icon.bi-arrow-left-short {
    cursor: pointer;
    vertical-align: -0.25em;
    margin-left: -6px;
    float: left;
    color: #333;
}
</style>
