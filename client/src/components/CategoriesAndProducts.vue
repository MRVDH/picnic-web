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
                    v-for="product in category.items"
                    :key="product.id"
                    cols="3"
                    >
                    <CustomProductCard
                        v-if="product.type === 'SINGLE_ARTICLE'"
                        :product="product"
                        />
                </b-col>
            </b-row>
        </div>
    </div>
</template>

<script>
import CustomProductCard from '@/components/ProductCard';

export default {
    name: 'CategoriesAndProducts',
    components: {
        CustomProductCard
    },
    props: {
        categories: Array
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
</style>
