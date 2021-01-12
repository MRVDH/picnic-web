<template>
    <b-row class="product-details">
        <b-col cols="7">
            <!-- Name and product quantity -->
            <h3>{{ product.name }}</h3>
            <span class="product-quantity text-success">{{ product.unit_quantity }}</span>
            <span
                v-if="product.unit_quantity_sub"
                class="product-quantity"
                >
                {{ product.unit_quantity_sub }}
            </span>

            <!-- Price -->
            <span class="price">
                <span
                    v-if="product.original_price"
                    class="original"
                    >
                    <span class="price-euros">{{ getPriceEuros(product.original_price) }}</span>.<sup>{{ getPriceCents(product.original_price) }}</sup>
                </span>
                <span
                    class="main-price"
                    :class="{ 'text-primary': product.original_price }"
                    >
                    <span class="price-euros">{{ getPriceEuros(product.price) }}</span>.<sup>{{ getPriceCents(product.price) }}</sup>
                </span>
            </span>

            <!-- Quantity -->
            <span class="float-right">
                <b-badge
                    class="badge-quantity"
                    @click="removeProductFromCart()"
                    >
                    -
                </b-badge>
                <b-badge
                    class="badge-quantity"
                    variant="light"
                    >
                    {{ getOrderQuantity() || 0 }}
                </b-badge>
                <b-badge
                    class="badge-quantity badge-add"
                    @click="addProductToCart()"
                    >
                    +
                </b-badge>
            </span>

            <!-- Allergy badges -->
            <!-- Description -->
            <!-- Nutrition value -->
            <!-- Ingredients -->
            <!-- Extra information -->
            <hr>
        </b-col>
        <b-col cols="5">
            <img src="../assets/img/placeholder.png">
        </b-col>
    </b-row>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

export default {
    name: 'ProductDetails',
    data () {
        return {
            product: null
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
            if (this.loggedIn && this.$route.params.productId) {
                this.getProductDetails();
            }
        },
    },
    mounted () {
        if (this.loggedIn && this.$route.params.productId) {
            this.getProductDetails();
        }
    },
    methods: {
        getProductDetails () {
            ApiService.getProductDetails(this.$route.params.productId).then(res => {
                this.product = res.data.product_details;
            });
        },
        getOrderQuantity () {
            for (let item of this.cart.items) {
                for (let subItem of item.items) {
                    if (subItem.id === this.product.id) {
                        return subItem.decorators.find(x => x.type === "QUANTITY").quantity
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
        addProductToCart () {
            ApiService.addProductToCart(this.product.id).then((res) => {
                this.cart = res.data;
                this.$bvToast.toast(`Product toegevoegd!`, {
                    toaster: 'b-toaster-bottom-left',
                    autoHideDelay: 3000,
                    variant: 'success',
                    appendToast: true,
                    noCloseButton: true
                });
            });
        },
        removeProductFromCart () {
            if (!this.getOrderQuantity()) {
                return;
            }

            ApiService.removeProductFromCart(this.product.id).then((res) => {
                this.cart = res.data;
                this.$bvToast.toast(`Product verwijderd!`, {
                    toaster: 'b-toaster-bottom-left',
                    autoHideDelay: 3000,
                    variant: 'success',
                    appendToast: true,
                    noCloseButton: true
                });
            });
        }
    }
}
</script>

<style scoped lang="scss">
.product-details {
    background: #FFF;
    padding: 20px;
}

h3 {
    margin-bottom: 25px;
}

img {
    background: #DDD;
    width: 100%;
}

.product-quantity {
    font-size: 14px;
    color: #999;
}

.badge-quantity {
    height: 22px;
    width: 22px;
    padding-top: 5px;
    padding-left: 5px;
    cursor: pointer;
    margin-right: 5px;

    &.badge-add {
        background: #88A91E;
        margin-right: 15px;
    }
}

.price {
    line-height: 1;
    float: right;
    font-weight: 600;
    font-size: 15px;

    .main-price {
        font-size: 22px;

        .price-euros {
            font-size: 26px;
        }
    }

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
</style>
