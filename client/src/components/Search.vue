<template>
    <div>
        <b-list-group>
            <b-list-group-item>
                <b-input-group v-if="!selectedCategory">
                    <b-input-group-prepend is-text>
                        <b-icon icon="search" />
                    </b-input-group-prepend>

                    <b-form-input
                        v-model="searchText"
                        type="search"
                        placeholder="Welk product zoek je?"
                        />
                </b-input-group>
                <div v-else>
                    <b-icon
                        icon="arrow-left-short"
                        font-scale="1.5"
                        @click="selectParent(selectedCategory.id)"
                        />
                    {{ selectedCategory.name }}
                </div>
            </b-list-group-item>

            <div
                v-if="!selectedCategory"
                class="other-items"
                >
                <b-list-group-item
                    v-for="category in allCategories"
                    :key="category.id"
                    button
                    @click="selectCategory(category)"
                    >
                    <!-- future image placeholder -->
                    <!-- <img src="../assets/img/placeholder-small.png"> -->
                    {{ category.name }}

                    <b-icon
                        class="float-right"
                        icon="chevron-right"
                        font-scale="0.8"
                        />
                </b-list-group-item>
            </div>
            <div v-if="selectedCategory && !showItems">
                <b-list-group-item
                    v-for="category in selectedCategory.items"
                    :key="category.id"
                    button
                    @click="selectCategory(category)"
                    >
                    <!-- future image placeholder -->
                    <!-- <img src="../assets/img/placeholder-small.png"> -->
                    {{ category.name }}

                    <b-icon
                        class="float-right"
                        icon="chevron-right"
                        font-scale="0.8"
                        />
                </b-list-group-item>
            </div>
        </b-list-group>

        <div v-if="showItems">
            <div
                v-for="category in selectCategoriesFromFinalCategory(selectedCategory.items)"
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

import CustomProductCard from '@/components/ProductCard';

export default {
    name: 'Search',
    components: {
        CustomProductCard
    },
    data () {
        return {
            searchText: "",
            allCategories: [],
            selectedCategory: null,
            showItems: false
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
                this.getCategories(3);
            }
        },
        searchText (text) {
            if (text.length < 2) {
                return;
            }

            // search suggestions
        }
    },
    mounted () {
        if (this.loggedIn) {
            this.getCategories();
        }
    },
    methods: {
        getCategories () {
            ApiService.getCategories().then(res => {
                this.allCategories = res.data.filter(x => x.is_included_in_category_tree);
            });
        },
        selectCategory (category) {
            this.selectedCategory = category;

            this.showItems = category.items.length && category.items.find(x => x.type === "SINGLE_ARTICLE");

            if (category.items.length) {
                return;
            }

            ApiService.getList(category.id, null, 1).then((res) => {
                this.selectedCategory.items = res.data;

                this.showItems = this.selectedCategory.items.length && this.selectedCategory.items.find(x => x.type === "SINGLE_ARTICLE");
            })
        },
        selectParent (parentId) {
            for (let category of this.allCategories) {
                for (let subCategory of category.items) {
                    if (subCategory.id === parentId) {
                        this.selectedCategory = category;
                        return;
                    }

                    if (subCategory.items && subCategory.items.length) {
                        for (let subSubCategory of subCategory.items) {
                            if (subSubCategory.id === parentId) {
                                this.selectedCategory = subCategory;
                                return;
                            }
                        }
                    }
                }
            }

            this.selectedCategory = null;
        },
        selectCategoriesFromFinalCategory (items) {
            return items.filter(x => x.type === "CATEGORY");
        }
    }
}
</script>

<style scoped>
.other-items .list-group-item:first-child {
    border-top: none;
}

.input-group-text {
    border-right: none;
    background: #f8f8f8;
    border-color: #eee;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}

.form-control {
    border-left: none;
    background: #f8f8f8;
    border-color: #eee;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}

img {
    height: 10px;
}

.b-icon.bi-chevron-right {
    margin-top: 5px;
}

.b-icon.bi-arrow-left-short {
    cursor: pointer;
    vertical-align: -0.25em;
    margin-left: -6px;
}

.categories .row {
    margin-bottom: 15px;
}

.category-name {
    font-weight: 500;
}
</style>
