<template>
    <b-list-group-item
        class="total"
        :class="{ 'padding-bottom': !showCheckout }"
        >
        <span
            v-if="savings"
            class="total-discount text-primary"
            >
            Korting
            <span class="discount-price">
                <span class="price-euros">-{{ getPriceEuros(savings) }}</span>.<sup>{{ getPriceCents(savings) }}</sup>
            </span>

            <hr>
        </span>

        Totaal
        <span class="total-price">
            <span class="price-euros">&euro; {{ getPriceEuros(price) }}</span>.<sup>{{ getPriceCents(price) }}</sup>
        </span>

        <b-button
            v-if="showCheckout"
            id="checkout-button"
            variant="primary"
            href="https://picnic.app/nl/deeplink/?path=cart"
            target="_blank"
            >
            Naar de kassa
        </b-button>
    </b-list-group-item>
</template>

<script>
export default {
    name: 'Totals',
    props: {
        savings: Number,
        price: Number,
        showCheckout: Boolean
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
        }
    }
}
</script>

<style scoped lang="scss">
.total {
    padding-top: 50px;
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

        hr {
            border: 1px #DDD dashed;
        }
    }

    #checkout-button {
        display: block;
        margin-top: 50px;
    }
}

.padding-bottom {
    padding-bottom: 50px;
}
</style>
