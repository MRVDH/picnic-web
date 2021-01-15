<template>
    <b-list-group-item
        class="product-item"
        :class="{ 'no-border-bottom': product._hidePrice }"
        >
        <b-badge
            class="quantity"
            @click="quantitySelectOpen = !quantitySelectOpen"
            >
            {{ product._quantity }}
        </b-badge>

        <div class="quantity-and-image">
            <img
                v-if="!quantitySelectOpen"
                :src="`https://storefront-prod.nl.picnicinternational.com/static/images/${product.image_ids[0]}/small.png`"
                style="cursor: pointer;"
                @click="goToProductPage()"
                >

            <img
                v-if="quantitySelectOpen"
                src="../assets/img/placeholder-small.png"
                style="width: 0;"
                >
            <b-badge
                v-if="quantitySelectOpen"
                class="badge-quantity badge-add"
                @click="addProductToCart(product)"
                >
                +
            </b-badge>
            <b-badge
                v-if="quantitySelectOpen"
                class="badge-quantity"
                @click="removeProductFromCart(product)"
                >
                -
            </b-badge>
        </div>

        <div
            class="product-info"
            @click="goToProductPage()"
            >
            <span
                class="product-name"
                :class="{ 'unavailable': unavailable }"
                >
                {{ product.name }}
            </span>
            <br>
            <span
                v-if="product.unit_quantity"
                class="product-quantity"
                >
                {{ product.unit_quantity }}
            </span>
            <span
                v-if="product.unit_quantity_sub"
                class="product-quantity"
                >
                {{ product.unit_quantity_sub }}
            </span>
        </div>

        <span
            v-if="!product._hidePrice && !unavailable"
            class="price"
            >
            <b-badge
                v-if="product._labelText"
                variant="warning"
                >
                {{ product._labelText }}
            </b-badge>

            <span
                v-if="product._discountPrice"
                class="original"
                >
                <span class="price-euros">{{ getPriceEuros(product._totalPrice) }}</span>.<sup>{{ getPriceCents(product._totalPrice) }}</sup>
            </span>
            <span :class="{ 'text-primary': product._discountPrice }">
                <span class="price-euros">{{ getPriceEuros(product._discountPrice ? product._discountPrice : product._totalPrice) }}</span>.<sup>{{ getPriceCents(product._discountPrice ? product._discountPrice : product._totalPrice) }}</sup>
            </span>
        </span>
    </b-list-group-item>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

export default {
    name: 'ShoppingCartItem',
    props: {
        product: Object,
        unavailable: Boolean
    },
    data () {
        return {
            quantitySelectOpen: false
        }
    },
    computed: {
        cart: {
            get () {
                return this.$store.state.cart;
            },
            set (cart) {
                this.$store.commit(SET_CART, cart);
            }
        }
    },
    methods: {
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
        },
        goToProductPage () {
            this.$router.push({ name: 'Product', params: { productId: this.product.id } });
        }
    }
}
</script>

<style scoped lang="scss">
.no-border-bottom {
    border-bottom: none;
}

.product-item {
    padding-top: 20px;
    padding-bottom: 20px;
    height: 90px;

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
        display: inline;
        
        img {
            height: 100%;
            width: 50px;
            object-fit: contain;
        }

        .badge {
            width: 20px;
            height: 20px;
            cursor: pointer;

            &.badge-add {
                margin-right: 10px;
            }
        }
    }

    .product-info {
        position: absolute;
        display: inline-block;
        margin-left: 20px;
        line-height: 1.1em;
        margin-top: 7px;
        cursor: pointer;

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
</style>
