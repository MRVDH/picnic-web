<template>
    <div>
        <div
            v-for="category in categories"
            :key="category.id"
            class="categories"
            >
            <b-row>
                <b-col cols="12">
                    <span class="category-name">{{ category.name }}</span>
                </b-col>
            </b-row>
            <b-row>
                <b-col
                    v-for="product in getProductsOnly(category.items)"
                    :key="product.id"
                    cols="6"
                    md="3"
                    >
                    <CustomProductCard :product="product" />
                </b-col>
            </b-row>
            <b-row v-if="!category.items.length">
                <b-col
                    v-for="n in 8"
                    :key="n"
                    cols="6"
                    md="3"
                    >
                    <b-skeleton-img no-aspect />
                </b-col>
            </b-row>
        </div>
    </div>
</template>

<script>
import CustomProductCard from '@/components/others/ProductCard';

export default {
    name: 'CategoriesAndProducts',
    components: {
        CustomProductCard
    },
    props: {
        categories: Array
    },
    methods: {
        getProductsOnly (items) {
            return items.filter(x => x.type === "SINGLE_ARTICLE");
        }
    }
}
</script>

<style scoped>
.categories .row {
    margin-bottom: 15px;
}

.category-name {
    font-weight: 500;
}

.b-skeleton-img {
    height: 370px;
    margin-bottom: 5px;
}
</style>
