<template>
    <div>
        <b-list-group>
            <b-list-group-item>
                <b-input-group v-if="!selectedTopCategory && !selectedSubCategory">
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
                        @click="goBack()"
                        />
                    {{ selectedSubCategory ? selectedSubCategory.name : selectedTopCategory.name }}
                </div>
            </b-list-group-item>

            <div
                v-if="!selectedTopCategory"
                class="other-items"
                >
                <b-list-group-item
                    v-for="category in allCategories"
                    :key="category.id"
                    button
                    @click="selectTopCategory(category)"
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
            <div
                v-if="selectedTopCategory && !selectedSubCategory"
                class="other-items"
                >
                <b-list-group-item
                    v-for="category in selectedTopCategory.items"
                    :key="category.id"
                    button
                    @click="selectSubCategory(category)"
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

        <div v-if="selectedSubCategory">
            <CustomCategoriesAndProducts :categories="finalCategories" />
        </div>
    </div>
</template>

<script>
import ApiService from '@/services/ApiService';

import CustomCategoriesAndProducts from '@/components/CategoriesAndProducts';

export default {
    name: 'Search',
    components: {
        CustomCategoriesAndProducts
    },
    data () {
        return {
            searchText: "",
            allCategories: [],
            selectedTopCategory: null,
            selectedSubCategory: null,
            finalCategories: []
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
        selectTopCategory (category) {
            this.selectedTopCategory = category;
        },
        selectSubCategory (category) {
            this.selectedSubCategory = category;

            this.finalCategories = [];

            ApiService.getList(category.id, null, 1).then((res) => {
                this.selectedSubCategory.items = res.data;

                this.finalCategories = this.selectedSubCategory.items.filter(x => x.type === "CATEGORY");
            })
        },
        goBack () {
            if (this.selectedSubCategory) {
                this.selectedSubCategory = null;
            } else {
                this.selectedTopCategory = null;
            }
        }
    }
}
</script>

<style scoped>
.list-group {
    margin-bottom: 20px;
}

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
</style>
