<template>
    <b-list-group
        v-if="loggedIn"
        class="d-none d-md-block"
        >
        <CustomDeliverySlot />

        <div v-if="items.length">
            <CustomShoppingCartItem
                v-for="item in items"
                :key="item.id"
                :product="item"
                :unavailable="false"
                :quantity-alterable="true"
                />
        </div>
        <b-list-group-item
            v-else
            class="empty-cart-box"
            >
            Nog geen producten toegevoegd.
        </b-list-group-item>

        <div v-if="unavailableItems.length">
            <b-list-group-item class="unable-to-deliver">
                De onderstaande items zijn niet leverbaar.
            </b-list-group-item>

            <CustomShoppingCartItem
                v-for="item in unavailableItems"
                :key="item.id"
                :product="item"
                :unavailable="true"
                :quantity-alterable="false"
                />
        </div>

        <CustomTotals
            v-if="cart && cart.items && cart.items.length && cart.total_price"
            :show-checkout="true"
            :savings="cart.total_savings"
            :price="cart.total_price"
            />
    </b-list-group>
</template>

<script>
import ApiService from '@/services/ApiService';
import DataConverterService from '@/services/DataConverterService';

import { SET_CART } from '@/store/mutationTypes';

import CustomDeliverySlot from '@/components/others/DeliverySlot';
import CustomShoppingCartItem from '@/components/others/ShoppingCartItem';
import CustomTotals from '@/components/others/Totals';

export default {
    name: 'ShoppingCart',
    components: {
        CustomDeliverySlot,
        CustomShoppingCartItem,
        CustomTotals
    },
    data () {
        return {
            slot: null,
            items: [],
            unavailableItems: []
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
        },
        cart () {
            if (this.cart) {
                this.processCartContents();
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
                this.processCartContents();
            });
        },
        processCartContents () {
            this.cart = DataConverterService.processCartContents(this.cart);

            this.slot = this.cart.delivery_slots.find(x => x.slot_id === this.cart.selected_slot.slot_id);

            this.items = [];
            this.unavailableItems = [];

            if (!this.cart.items || !this.cart.items.length) {
                return;
            }

            for (let item of this.cart.items) {
                for (let i = 0; i < item.items.length; i++) {
                    let subItem = item.items[i];

                    subItem._quantitySelectOpen = false;

                    if (item.price) {
                        this.items.push(subItem);
                    } else {
                        this.unavailableItems.push(subItem);
                    }
                }
            }
        }
    }
}
</script>

<style scoped lang="scss">
.unable-to-deliver {
    background: #f8f8f8;
}

.empty-cart-box {
    text-align: center;
}
</style>
