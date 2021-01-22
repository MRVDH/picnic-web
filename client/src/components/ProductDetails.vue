<template>
    <b-row
        v-if="product"
        class="product-details"
        >
        <b-col cols="6">
            <!-- Name and product quantity -->
            <div class="product-title">
                <h3>{{ product.name }}</h3>
                <b-badge
                    v-if="getLabel()"
                    variant="warning"
                    class="badge-label"
                    >
                    {{ getLabel() }}
                </b-badge>
            </div>
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
            <span
                v-if="loggedIn"
                class="float-right"
                >
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

            <hr>

            <!-- Allergy badges -->
            <b-badge
                v-if="product.fresh_label"
                variant="success"
                class="allergy-badge"
                >
                +{{ product.fresh_label.number }} {{ product.fresh_label.unit }}
            </b-badge>
            <span
                v-if="product.tags && product.tags.length"
                class="allergy-badge"
                >
                <b-badge
                    v-for="tag in product.tags"
                    :key="tag.name"
                    :style="{ 'background-color': tag.color }"
                    :title="tag.description"
                    >
                    {{ tag.name }}
                </b-badge>
            </span>

            <!-- Description -->
            <p class="description">{{ product.description }}</p>
            
            <!-- Nutrition value -->
            <h5 v-if="product.nutritional_values && product.nutritional_values.length">Voedingswaarde</h5>
            <div
                v-if="product.nutritional_values && product.nutritional_values.length"
                class="nutrition-table"
                >
                <div class="table-header">
                    <span class="column-2">% RI</span>
                    <span class="column-1">100 g</span>
                </div>
                <div
                    v-for="nutVal in product.nutritional_values"
                    :key="nutVal.name"
                    >
                    <div 
                        class="nutrition-table-row"
                        >
                        <span class="nutrition-title">{{ nutVal.name }}</span>
                        <span class="column-2">{{ nutVal.gda_percentage }}</span>
                        <span class="column-1">{{ nutVal.value }}</span>
                    </div>
                    <div v-if="nutVal.sub_values && nutVal.sub_values.length">
                        <div
                            v-for="subVal in nutVal.sub_values"
                            :key="subVal.name"
                            class="nutrition-table-row"
                            >
                            <span class="sub-item">{{ subVal.name }}</span>
                            <span class="column-2">{{ subVal.gda_percentage || '-' }}</span>
                            <span class="column-1">{{ subVal.value }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ingredients -->
            <h5
                v-if="product.ingredients_blob"
                class="mt-4"
                >
                Ingredienten
            </h5>
            <p v-if="product.ingredients_blob">{{ product.ingredients_blob }}</p>

            <!-- Extra information -->
            <h5
                v-if="additionalInfoItmes"
                class="my-4"
                >
                Extra informatie
            </h5>
            <div v-if="additionalInfoItmes">
                <div
                    v-for="item in additionalInfoItmes"
                    :key="item.id"
                    >
                    <h6>{{ item.title }}</h6>
                    <p>{{ item.text }}</p>
                </div>
            </div>
        </b-col>
        <b-col
            cols="5"
            offset="1"
            >
            <div class="image-container">
                <b-carousel
                    v-if="product.image_ids.length > 1"
                    indicators
                    controls
                    height="480"
                    :interval="999999999"
                    >
                    <!-- Text slides with image -->
                    <b-carousel-slide
                        v-for="(imageId, index) in product.image_ids"
                        :key="index"
                        :img-src="`https://storefront-prod.nl.picnicinternational.com/static/images/${imageId}/large.png`"
                        />
                </b-carousel>
                <img
                    v-else
                    :src="`https://storefront-prod.nl.picnicinternational.com/static/images/${product.image_ids[0]}/large.png`"
                    >
            </div>
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
        },
        additionalInfoItmes () {
            if (this.product && this.product.items && this.product.items.length && this.product.items.find(x => x.id === "additional_info")) {
                return this.product.items.find(x => x.id === "additional_info").items;
            }

            return null;
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
        if (this.$route.params.productId) {
            this.getProductDetails();
        }
    },
    methods: {
        getProductDetails () {
            ApiService.getProductDetails(this.$route.params.productId).then(res => {
                this.product = res.data.product_details;
            });
        },
        getLabel () {
            return this.product.decorators && this.product.decorators.length && this.product.decorators.find(x => x.type === "LABEL") ? this.product.decorators.find(x => x.type === "LABEL").text : null;
        },
        getOrderQuantity () {
            if (this.cart && this.cart.items && this.cart.items.length) {
                for (let item of this.cart.items) {
                    for (let subItem of item.items) {
                        if (subItem.id === this.product.id) {
                            return subItem.decorators.find(x => x.type === "QUANTITY").quantity
                        }
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

    img {
        height: 400px;
        object-fit: contain;
    }
}

.carousel-item {
    height: 400px;

    ::v-deep img {
        height: 100%;
        object-fit: contain;
    }
}

.product-title {
    height: 60px;
}

h3 {
    margin-bottom: 0;
}

.image-container {
    padding: 20px;
    background: #fff;
    background: linear-gradient(180deg, #fff 0%, #eee 100%);
}

img {
    width: 100%;
}

::v-deep .carousel-control-prev-icon {
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23999' viewBox='0 0 8 8'%3E%3Cpath d='M5.25 0l-4 4 4 4 1.5-1.5-2.5-2.5 2.5-2.5-1.5-1.5z'/%3E%3C/svg%3E") !important;
}

::v-deep .carousel-control-next-icon {
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23999' viewBox='0 0 8 8'%3E%3Cpath d='M2.75 0l-1.5 1.5 2.5 2.5-2.5 2.5 1.5 1.5 4-4-4-4z'/%3E%3C/svg%3E") !important;
}

::v-deep .carousel-indicators .active {
    background-color: #E1171E;
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

.allergy-badge, .allergy-badge span {
    margin-right: 10px;
}

.description {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.nutrition-table {
    color: #666;
    line-height: 1.8rem;

    .column-1 {
        float: right;
    }

    .column-2 {
        float: right;
        width: 80px;
        text-align: right;
    }

    .table-header {
        height: 29px;
        font-size: 15px;
        font-weight: 600;
    }

    .nutrition-table-row {
        border-bottom: 1px solid #BBB;

        .nutrition-title {
            font-weight: 600;
        }

        .sub-item {
            margin-left: 10px;
        }
    }
}
</style>
