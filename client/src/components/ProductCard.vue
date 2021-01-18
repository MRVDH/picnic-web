<template>
    <b-col
        cols="12"
        class="category-card"
        >
        <div class="inner-container">
            <div class="image-container">
                <img
                    :src="`https://storefront-prod.nl.picnicinternational.com/static/images/${product.image_id}/medium.png`"
                    @click="addProductToCart()"
                    >
            </div>
            <span
                class="product-name"
                @click="addProductToCart()"
                >
                {{ product.name }}
            </span>
            <br>
            <span class="product-quantity">{{ product.unit_quantity }}</span>
            <span
                v-if="product.unit_quantity_sub"
                class="product-quantity"
                >
                {{ product.unit_quantity_sub }}
            </span>
            <br v-if="getLabel()">
            <b-badge
                v-if="getLabel()"
                variant="warning"
                class="badge-label"
                >
                {{ getLabel() }}
            </b-badge>
            <br>
            <b-badge
                v-if="getOrderQuantity() && quantitySelectOpen"
                class="badge-quantity"
                @click="removeProductFromCart()"
                >
                -
            </b-badge>
            <b-badge
                v-if="getOrderQuantity()"
                class="badge-quantity"
                :variant="quantitySelectOpen ? 'light' : ''"
                @click="quantitySelectOpen = !quantitySelectOpen"
                >
                {{ getOrderQuantity() }}
            </b-badge>
            <b-badge
                v-if="getOrderQuantity() && quantitySelectOpen"
                class="badge-quantity badge-add"
                @click="addProductToCart()"
                >
                +
            </b-badge>

            <a :href="`#/product/${product.id}`">
                <b-icon
                    class="details-icon"
                    icon="exclamation-circle"
                    font-scale="1.3"
                    />
            </a>

            <span class="price">
                <span
                    v-if="hasDiscount()"
                    class="original"
                    >
                    <span class="price-euros">{{ getPriceEuros(product) }}</span>.<sup>{{ getPriceCents(product) }}</sup>
                </span>
                <span :class="{ 'text-primary': hasDiscount() }">
                    <span class="price-euros">{{ getPriceEuros(product, hasDiscount()) }}</span>.<sup>{{ getPriceCents(product, hasDiscount()) }}</sup>
                </span>
            </span>
        </div>
    </b-col>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

export default {
    name: 'ProductCard',
    props: {
        product: Object
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
        getOrderQuantity () {
            for (let item of this.cart.items) {
                for (let subItem of item.items) {
                    if (subItem.id === this.product.id) {
                        return subItem.decorators.find(x => x.type === "QUANTITY").quantity
                    }
                }
            }
        },
        getPriceEuros (product, discount) {
            if (!product.display_price) {
                return 0;
            }

            let price = discount ? product.decorators.find(x => x.type === "PRICE").display_price : product.display_price.toString();

            if (price.toString().length > 2) {
                return price.toString().slice(0, -2);
            } else {
                return 0;
            }
        },
        getPriceCents (product, discount) {
            if (!product.display_price) {
                return "00";
            }

            let price = discount ? product.decorators.find(x => x.type === "PRICE").display_price : product.display_price.toString();

            return price.toString().slice(-2);
        },
        hasDiscount () {
            return this.product.decorators && this.product.decorators.length && this.product.decorators.find(x => x.type === "PRICE");
        },
        getLabel () {
            return this.product.decorators && this.product.decorators.length && this.product.decorators.find(x => x.type === "LABEL") ? this.product.decorators.find(x => x.type === "LABEL").text : null;
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
.category-card {
    background: #fff;
    border-radius: 4px;
    height: 370px;
    margin-bottom: 6px;

    .inner-container {
        padding: 10px;

        .image-container {
            padding: 0 30px;
            padding-top: 15px;
        }

        img {
            width: 100%;
            height: 200px;
            object-fit: contain;
            cursor: pointer;
        }

        .product-name {
            font-weight: 500;
            cursor: pointer;
        }

        .product-quantity {
            font-size: 14px;
            color: #999;
        }

        .badge-label {
            display: inline;
            margin-right: 15px;
            font-size: 12px;
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
            }
        }

        .details-icon {
            color: #999;
            cursor: pointer;
            position: absolute;
            bottom: 10px;
            left: 10px;
        }

        .price {
            line-height: 1;
            position: absolute;
            bottom: 10px;
            right: 8px;
            font-weight: 600;
            font-size: 18px;

            sup {
                left: -0.3em;
            }

            .original {
                color: #CCC;
                font-weight: 400;
                padding-right: 10px;
            }

            .price-euros {
                font-size: 22px;
            }
        }
    }
}
</style>
