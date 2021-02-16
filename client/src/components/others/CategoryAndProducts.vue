<template>
    <div>
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
</template>

<script>
import ApiService from '@/services/ApiService';

import CustomProductCard from '@/components/others/ProductCard';

export default {
    name: 'CategoryAndProducts',
    components: {
        CustomProductCard
    },
    props: {
        category: Object,
        parentId: String
    },
    mounted () {
        if (this.category.decorators && this.category.decorators.length && this.category.decorators.find(x => x.type === "MORE_BUTTON")) {
            if (this.parentId) {
                ApiService.getList(this.parentId, this.category.id, 1).then((res) => {
                    this.category.items = res.data;
                });
            } else {
                ApiService.getList(this.category.id, null, 1).then((res) => {
                    this.category.items = res.data;
                });
            }
        }
    },
    methods: {
        getProductsOnly (items) {
            return items.filter(x => x.type === "SINGLE_ARTICLE");
        }
    }
}
</script>

<style scoped>
.row {
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
