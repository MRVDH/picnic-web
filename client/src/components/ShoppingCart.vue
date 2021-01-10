<template>
    <b-list-group>
        <b-list-group-item>
            <div class="delivery-card">
                <b-icon icon="clock" />
                {{ timeString }}
            </div>
        </b-list-group-item>

        <div v-if="cart && cart.items && cart.items.length">
            <b-list-group-item
                v-for="item in cart.items"
                :key="item.id"
                class="product-item"
                >
                <b-badge>{{ getItemQuantity(item) }}</b-badge>

                <img src="../assets/img/placeholder-small.png">

                <div class="product-info">
                    <span class="product-name">{{ item.items[0].name }}</span>
                    <br>
                    <span
                        v-if="item.items[0].unit_quantity"
                        class="product-quantity"
                        >
                        {{ item.items[0].unit_quantity }}
                    </span>
                    <span
                        v-if="item.items[0].unit_quantity_sub"
                        class="product-quantity"
                        >
                        {{ item.items[0].unit_quantity_sub }}
                    </span>
                </div>

                <span class="price">
                    <span
                        v-if="getDiscount(item)"
                        class="original"
                        >
                        <span class="price-euros">{{ getPriceEuros(getDiscount(item)) }}</span>.<sup>{{ getPriceCents(getDiscount(item)) }}</sup>
                    </span>
                    <span :class="{ 'text-primary': getDiscount(item) }">
                        <span class="price-euros">{{ getPriceEuros(item.price) }}</span>.<sup>{{ getPriceCents(item.price) }}</sup>
                    </span>
                </span>
            </b-list-group-item>
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

export default {
    name: 'ShoppingCart',
    data () {
        return {
            cart: null,
            slot: null
        }
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
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
                this.slot = this.cart.delivery_slots.find(x => x.slot_id === this.cart.selected_slot.slot_id);
            });
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
        getItemQuantity (item) {
            return item.items[0].decorators.find(x => x.type === "QUANTITY").quantity;
        },
        getDiscount (product) {
            console.log(product.decorators);
            return product.decorators && product.decorators.length && product.decorators.find(x => x.type === "PRICE") ? product.decorators.find(x => x.type === "PRICE").display_price : null;
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

.product-item {
    padding-top: 20px;
    padding-bottom: 20px;

    &:first-child {
        border-top: none;
    }

    &:last-child {
        border-bottom: none;
    }

    .badge {
        height: 22px;
        width: 22px;
        padding-top: 5px;
        padding-left: 6px;
    }

    img {
        margin-left: 20px;
        height: 50px;
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
    }

    .price .price-euros {
        font-size: 19px;
    }

    .price .original {
        color: #CCC;
        font-weight: 400;
        padding-right: 10px;
    }

    .price sup {
        left: -0.3em;
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
