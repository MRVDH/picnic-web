<template>
    <b-col
        cols="12"
        class="category-card"
        >
        <div class="inner-container">
            <img src="../assets/img/placeholder.png">
            <span class="product-name">{{ product.name }}</span>
            <br>
            <span class="product-quantity">{{ product.unit_quantity }}</span>
            <span
                v-if="product.unit_quantity_sub"
                class="product-quantity"
                >
                {{ product.unit_quantity_sub }}
            </span>
            <br>
            <b-badge
                v-if="getLabel(product)"
                variant="warning"
                >
                {{ getLabel(product) }}
            </b-badge>

            <b-icon
                class="details-icon"
                icon="exclamation-circle"
                font-scale="1.3"
                />

            <span class="price">
                <span
                    v-if="hasDiscount(product)"
                    class="original"
                    >
                    <span class="price-euros">{{ getPriceEuros(product) }}</span>.<sup>{{ getPriceCents(product) }}</sup>
                </span>
                <span :class="{ 'text-primary': hasDiscount(product) }">
                    <span class="price-euros">{{ getPriceEuros(product, hasDiscount(product)) }}</span>.<sup>{{ getPriceCents(product, hasDiscount(product)) }}</sup>
                </span>
            </span>
        </div>
    </b-col>
</template>

<script>
export default {
    name: 'ProductCard',
    props: {
        product: Object
    },
    methods: {
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
        hasDiscount (product) {
            return product.decorators && product.decorators.length && product.decorators.find(x => x.type === "PRICE");
        },
        getLabel (product) {
            return product.decorators && product.decorators.length && product.decorators.find(x => x.type === "LABEL").text;
        }
    }
}
</script>

<style scoped>
.category-card {
    background: #fff;
    border-radius: 4px;
    height: 350px;
    margin-bottom: 6px;
}

.category-card img {
    width: 100%;
}

.inner-container {
    padding: 10px;
}

.product-name {
    font-weight: 500;
}

.product-quantity {
    font-size: 14px;
    color: #999;
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
}

.price .price-euros {
    font-size: 22px;
}

.price .original {
    color: #CCC;
    font-weight: 400;
    padding-right: 10px;
}

.price sup {
    left: -0.3em;
}

.badge {
    display: inline;
    margin-right: 15px;
    font-size: 12px;
}
</style>
