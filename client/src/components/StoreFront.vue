<template>
    <div>
        <b-row class="top-menu-items">
            <b-col cols="12">
                <div
                    v-if="topMenuItems.length"
                    class="floating-box"
                    >
                    <b-tabs pills>
                        <b-tab
                            v-for="item in topMenuItems"
                            :key="item.id"
                            :title="item.name"
                            :active="item.name === selectedTopMenuItem.name"
                            @click="selectTopMenuItem(item)"
                            />
                    </b-tabs>
                </div>
            </b-col>
        </b-row>

        <div v-if="selectedTopMenuItem">
            <div
                v-for="category in selectedTopMenuItem.items"
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
    </div>
</template>

<script>
import ApiService from '@/services/ApiService';

import CustomProductCard from '@/components/ProductCard'

export default {
    name: 'StoreFront',
    components: {
        CustomProductCard
    },
    data () {
        return {
            lists: [],
            topMenuItems: [],
            selectedTopMenuItem: null,
            productCategories: []
        }
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
        }
    },
    watch: {
        loggedIn () {
            if (this.loggedIn) {
                this.getLists();
            }
        }
    },
    mounted () {
        if (this.loggedIn) {
            this.getLists();
        }
    },
    methods: {
        getLists () {
            ApiService.getLists().then((res) => {
                this.lists = res.data.filter(x => !x.hidden && x.sellable_item_count > 0);

                this.topMenuItems = this.lists.filter(x => !x.is_included_in_category_tree);
                this.selectedTopMenuItem = this.topMenuItems[0];
                this.productCategories = this.lists.filter(x => x.is_included_in_category_tree);
            });
        },
        selectTopMenuItem (item) {
            this.selectedTopMenuItem = item;

            if (this.selectedTopMenuItem.items[0].items.length) {
                return;
            }

            ApiService.getList(this.selectedTopMenuItem.id, null, 3).then((res) => {
                this.selectedTopMenuItem.items = res.data;
            });
        }
    }
}
</script>

<style scoped>
.floating-box {
    background: white;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
    border-radius: 15px;
    display: inline-block;
    padding: 5px;
}

.floating-box >>> .nav-item a {
    border-radius: 12px;
    color: #333;
    font-weight: 500;
}

.floating-box >>> .nav-item a.active {
    color: #fff;
}

.top-menu-items {
    margin-bottom: 20px;
}

.categories .row {
    margin-bottom: 15px;
}

.category-name {
    font-weight: 500;
}
</style>
