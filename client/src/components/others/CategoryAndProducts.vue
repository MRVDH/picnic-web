<template>
    <div>
        <b-row>
            <b-col cols="12">
                <span class="category-name">{{ category.name }}</span>
            </b-col>
        </b-row>
        <b-row>
            <b-col
                v-for="product in productsOnly"
                :key="product.id"
                cols="6"
                md="3"
                >
                <CustomProductCard :product="product" />
            </b-col>
            <b-col
                v-if="category.items.length && hasMore && !isShowingMore"
                cols="6"
                md="3"
                >
                <b-col
                    cols="12"
                    class="view-more"
                    @click="showMore()"
                    >
                    <div class="inner-container">
                        <span>
                            Bekijk meer
                        </span>
                        <b-icon
                            icon="chevron-right"
                            font-scale="2.5"
                            />
                    </div>
                </b-col>
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
    data () {
        return {
            isShowingMore: false
        }
    },
    computed: {
        productsOnly () {
            return this.category.items.filter(x => x.type === "SINGLE_ARTICLE");
        },
        hasMore () {
            return this.category.decorators && this.category.decorators.length && this.category.decorators.find(x => x.type === "MORE_BUTTON");
        }
    },
    methods: {
        showMore () {
            if (this.parentId) {
                ApiService.getList(this.parentId, this.category.id, 1).then((res) => {
                    this.category.items = res.data;
                    this.isShowingMore = true;
                });
            } else {
                ApiService.getList(this.category.id, null, 1).then((res) => {
                    this.category.items = res.data;
                    this.isShowingMore = true;
                });
            }
        }
    }
}
</script>

<style scoped lang="scss">
.row {
    margin-bottom: 15px;
}

.category-name {
    font-weight: 500;
}

.view-more {
    background: #fff;
    border-radius: 4px;
    height: 370px;
    margin-bottom: 6px;

    .inner-container {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        color: #E1171E;
        cursor: pointer;

        span {
            font-weight: 600;
            line-height: 4rem;
        }

        .b-icon {
            padding: 10px;
            color: white;
            background: #E1171E;
            border-radius: 50%;
        }
    }
}

.b-skeleton-img {
    height: 370px;
    margin-bottom: 5px;
}
</style>
