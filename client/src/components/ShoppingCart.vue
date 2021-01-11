<template>
    <b-list-group>
        <b-list-group-item>
            <div class="delivery-card">
                <b-icon icon="clock" />
                {{ timeString }}
            </div>
        </b-list-group-item>

        <div v-if="items.length">
            <CustomShoppingCartItem
                v-for="item in items"
                :key="item.id"
                :product="item"
                :unavailable="false"
                />
        </div>

        <div v-if="unavailableItems.length">
            <b-list-group-item class="unable-to-deliver">
                De onderstaande items zijn niet leverbaar.
            </b-list-group-item>

            <CustomShoppingCartItem
                v-for="item in unavailableItems"
                :key="item.id"
                :product="item"
                :unavailable="true"
                />
        </div>

        <b-list-group-item
            v-if="cart && cart.items && cart.items.length && cart.total_price"
            class="total"
            >
            <span
                v-if="cart.total_savings"
                class="total-discount text-primary"
                >
                Korting
                <span class="discount-price">
                    <span class="price-euros">-{{ getPriceEuros(cart.total_savings) }}</span>.<sup>{{ getPriceCents(cart.total_savings) }}</sup>
                </span>

                <hr>
            </span>

            Totaal
            <span class="total-price">
                <span class="price-euros">&euro; {{ getPriceEuros(cart.total_price) }}</span>.<sup>{{ getPriceCents(cart.total_price) }}</sup>
            </span>
        </b-list-group-item>
    </b-list-group>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

import CustomShoppingCartItem from '@/components/ShoppingCartItem';

export default {
    name: 'ShoppingCart',
    components: {
        CustomShoppingCartItem
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
        },
        timeString () {
            if (!this.slot) {
                return "";
            }

            let startDate = new Date(this.slot.window_start);
            let endDate = new Date(this.slot.window_end);

            let name = startDate.toLocaleDateString("nl-NL", { weekday: 'long' });
            name = name.charAt(0).toUpperCase() + name.slice(1);

            name += ` ${startDate.getHours().toString().length === 1 ? '0' + startDate.getHours() : startDate.getHours()}:${startDate.getMinutes().toString().length === 1 ? '0' + startDate.getMinutes() : startDate.getMinutes()} - `;
            name += `${endDate.getHours().toString().length === 1 ? '0' + endDate.getHours() : endDate.getHours()}:${endDate.getMinutes().toString().length === 1 ? '0' + endDate.getMinutes() : endDate.getMinutes()}`;

            return name;
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
            this.slot = this.cart.delivery_slots.find(x => x.slot_id === this.cart.selected_slot.slot_id);

            this.items = [];

            if (!this.cart.items || !this.cart.items.length) {
                return;
            }

            for (let item of this.cart.items) {
                for (let i = 0; i < item.items.length; i++) {
                    let subItem = item.items[i];

                    subItem._quantity = subItem.decorators.find(x => x.type === "QUANTITY").quantity;
                    subItem._totalPrice = item.price;
                    subItem._hidePrice = item.items.length > 1 && i !== item.items.length - 1;

                    if (item.decorators && item.decorators.length) {
                        if (item.decorators.find(x => x.type === "PRICE")) {
                            subItem._discountPrice = item.decorators.find(x => x.type === "PRICE").display_price;
                        }

                        if (item.decorators.find(x => x.type === "LABEL")) {
                            subItem._labelText = item.decorators.find(x => x.type === "LABEL").text.toLowerCase();
                        }
                    }

                    subItem._quantitySelectOpen = false;

                    if (item.price) {
                        this.items.push(subItem);
                    } else {
                        this.unavailableItems.push(subItem);
                    }
                }
            }
        },
        getPriceEuros (price) {
            if (price.toString().length > 2) {
                return price.toString().slice(0, -2);
            } else {
                return 0;
            }
        },
        getPriceCents (price) {
            return price.toString().slice(-2);
        },
        getDiscount (product) {
            return product.decorators && product.decorators.length && product.decorators.find(x => x.type === "PRICE") ? product.decorators.find(x => x.type === "PRICE").display_price : null;
        },
        getItemQuantity (item) {
            return item.items[0].decorators.find(x => x.type === "QUANTITY").quantity;
        }
    }
}
</script>

<style scoped lang="scss">
.delivery-card {
    background: #f8f8f8;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 10px 15px;
    font-weight: 500;
    text-align: center;
    min-height: 46px;

    .b-icon {
        float: left;
        margin-top: 3px;
    }
}

.no-border-bottom {
    border-bottom: none;
}

.unable-to-deliver {
    background: #f8f8f8;
}

.product-item {
    padding-top: 20px;
    padding-bottom: 20px;

    &:first-child {
        border-top: none;
    }

    &:last-child {
        border-bottom: none;
    }

    .quantity.badge {
        height: 22px;
        width: 22px;
        padding-top: 5px;
        padding-left: 5px;
        cursor: pointer;
    }

    .quantity-and-image {
        margin-left: 20px;
        height: 50px;
        width: 50px;
        display: inline-block;
        
        img {
            height: 50px;
            width: 50px;
        }
    }

    .product-info {
        position: absolute;
        display: inline-block;
        margin-left: 20px;
        line-height: 1.1em;
        margin-top: 7px;

        .product-name {
            font-size: 15px;
            font-weight: 500;

            &.unavailable {
                color: #999;
            }
        }

        .product-quantity {
            font-size: 12px;
            color: #999;
        }
    }

    .price {
        line-height: 1;
        position: absolute;
        bottom: 20px;
        right: 1.25rem;
        font-weight: 600;
        font-size: 15px;

        .price-euros {
            font-size: 19px;
        }

        .original {
            color: #CCC;
            font-weight: 400;
            padding-right: 10px;
        }

        sup {
            left: -0.3em;
        }

        .badge {
            display: inline;
            margin-right: 15px;
            font-size: 12px;
        }
    }
}

.total {
    padding-top: 50px;
    padding-bottom: 50px;
    font-weight: 600;
    font-size: 19px;

    sup {
        left: -0.3em;
    }

    .total-price {
        float: right;
        font-size: 18px;

        .price-euros {
            font-size: 22px;
        }
    }

    .total-discount {
        font-size: 15px;

        .discount-price {
            float: right;
            font-weight: 600;
            font-size: 13px;

            .price-euros {
                font-size: 17px;
            }
        }
    }
}

hr {
    border: 1px #DDD dashed;
}
</style>
