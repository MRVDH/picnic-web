<template>
    <div class="d-none d-md-block">
        <b-list-group class="list-header-group">
            <b-list-group-item class="list-header">
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
                    
                    <b-tabs
                        v-if="selectedSubCategory && finalCategories.length !== 1"
                        v-model="subCategoryTabIndex"
                        pills
                        >
                        <b-tab
                            v-for="item in subListCategories"
                            :key="item.id"
                            :title="item.name"
                            @click="jumpToCategory(item.id)"
                            />
                    </b-tabs>
                </div>
            </b-list-group-item>

            <div
                v-if="!allCategories || !allCategories.length"
                class="other-items"
                >
                <b-list-group-item
                    v-for="n in 19"
                    :key="n"
                    >
                    <b-skeleton-img no-aspect />
                    
                    <b-skeleton />
                </b-list-group-item>
            </div>

            <div
                v-if="!selectedTopCategory && !searchText"
                class="other-items"
                >
                <b-list-group-item
                    v-for="category in allCategories"
                    :key="category.id"
                    button
                    @click="selectTopCategory(category)"
                    >
                    <img :src="`https://storefront-prod.nl.picnicinternational.com/static/images/${category.image_id}/small.png`">
                    
                    <span class="category-title">{{ category.name }}</span>

                    <b-icon
                        class="float-right"
                        icon="chevron-right"
                        font-scale="0.8"
                        />
                </b-list-group-item>
            </div>
            <div
                v-if="selectedTopCategory && !selectedSubCategory && !searchText"
                class="other-items"
                >
                <b-list-group-item
                    v-for="category in selectedTopCategory.items"
                    :key="category.id"
                    button
                    @click="selectSubCategory(category)"
                    >
                    <img :src="`https://storefront-prod.nl.picnicinternational.com/static/images/${category.image_id}/small.png`">
                    
                    <span class="category-title">{{ category.name }}</span>

                    <b-icon
                        class="float-right"
                        icon="chevron-right"
                        font-scale="0.8"
                        />
                </b-list-group-item>
            </div>

            <div
                v-if="searchText && !searchResults.length"
                class="other-items"
                >
                <b-list-group-item
                    v-for="suggestion in suggestions"
                    :key="suggestion.id"
                    button
                    @click="selectSuggestion(suggestion.suggestion)"
                    >
                    {{ suggestion.suggestion }}

                    <b-icon
                        class="float-right"
                        icon="chevron-right"
                        font-scale="0.8"
                        />
                </b-list-group-item>
            </div>
        </b-list-group>

        <div v-if="searchResults.length">
            <CustomCategoryAndProducts
                v-for="category in searchResults"
                :key="category.id"
                :category="category"
                :show-header="false"
                />
        </div>

        <div v-if="selectedSubCategory">
            <CustomCategoryAndProducts
                v-for="category in finalCategories"
                :key="category.id"
                :category="category"
                :show-header="finalCategories.length !== 1"
                />
        </div>
    </div>
</template>

<script>
import ApiService from '@/services/ApiService';

import CustomCategoryAndProducts from '@/components/others/CategoryAndProducts';

export default {
    name: 'Search',
    components: {
        CustomCategoryAndProducts
    },
    data () {
        return {
            searchText: "",
            allCategories: [],
            selectedTopCategory: null,
            selectedSubCategory: null,
            finalCategories: [],
            suggestions: [],
            searchResults: [],
            subCategoryTabIndex: 0
        }
    },
    computed: {
        loggedIn () {
            return this.$store.state.authKey;
        },
        subListCategories () {
            return this.selectedSubCategory && this.selectedSubCategory.items && this.selectedSubCategory.items.length ? this.selectedSubCategory.items.filter(x => x.type === "CATEGORY") : [];
        }
    },
    watch: {
        loggedIn () {
            if (this.loggedIn) {
                this.getCategories();
            }
        },
        searchText (text) {
            this.searchResults = [];

            if (text.length < 2) {
                if (this.$route.name !== 'Search') {
                    this.$router.push({ name: 'Search' });
                }
                return;
            }

            ApiService.getSuggestions(text).then(res => {
                this.suggestions = res.data;
            });
        },
        $route (to, from) {
            if (to.name === "Search") {
                if (from.name === "SearchQuery") {
                    this.searchText = "";
                    this.searchResults = [];
                }
                if (from.name === "SearchList") {
                    this.selectedSubCategory = null;
                    this.selectedTopCategory = null;
                }
            }
        }
    },
    created () {
        window.addEventListener('scroll', this.handleScroll);
    },
    mounted () {
        if (this.$route.params.query) {
            this.selectSuggestion(this.$route.params.query);
        }

        this.getCategories();
    },
    destroyed () {
        window.removeEventListener('scroll', this.handleScroll);
    },
    methods: {
        getCategories () {
            ApiService.getCategories().then(res => {
                this.allCategories = res.data.filter(x => x.is_included_in_category_tree);

                if (this.$route.params.listId) {
                    this.selectTopCategory(this.allCategories.find(x => x.id === this.$route.params.listId));
                }
            });
        },
        selectTopCategory (category) {
            this.selectedTopCategory = category;

            if (this.$route.params.subListId) {
                this.selectSubCategory(this.selectedTopCategory.items.find(x => x.id === this.$route.params.subListId));
            } else if (this.$route.params.listId !== category.id) {
                this.$router.push({ name: 'SearchList', params: { listId: category.id } });
            }
        },
        selectSubCategory (category) {
            this.selectedSubCategory = category;

            if (this.$route.params.subListId !== category.id) {
                this.$router.push({ name: 'SearchList', params: { listId: this.selectedTopCategory.id, subListId: category.id } });
            }

            this.finalCategories = [];

            ApiService.getList(category.id, null, 1).then((res) => {
                this.selectedSubCategory.items = res.data;

                this.finalCategories = this.selectedSubCategory.items.filter(x => x.type === "CATEGORY");
            })
        },
        selectSuggestion (suggestion) {
            this.searchText = suggestion;
            
            if (this.$route.params.query !== this.searchText) {
                this.$router.push({ name: 'SearchQuery', params: { query: this.searchText } });
            }

            ApiService.search(this.searchText).then(res => {
                this.searchResults = res.data;
            });
        },
        goBack () {
            if (this.selectedSubCategory) {
                this.selectedSubCategory = null;
                this.$router.push({ name: 'SearchList', params: { listId: this.selectedTopCategory.id } });
            } else {
                this.selectedTopCategory = null;
                this.$router.push({ name: 'Search' });
            }
        },
        jumpToCategory (id) {
            window.scrollTo({top: document.getElementById(id).getBoundingClientRect().top + window.pageYOffset + -120, behavior: 'smooth'});
        },
        handleScroll () {
            let currentCategory = null;

            for (let category of this.subListCategories) {
                var elementRelativeToViewport = document.getElementById(category.id).getBoundingClientRect().y;

                if (elementRelativeToViewport > 0 && elementRelativeToViewport < window.innerHeight / 2) {
                    currentCategory = category;
                    break;
                }
            }

            if (currentCategory) {
                this.subCategoryTabIndex = this.subListCategories.indexOf(currentCategory);
            }
        }
    }
}
</script>

<style scoped>
.tabs {
    margin-top: 0.75rem;
}

.tabs >>> .nav-link {
    font-size: 13px;
    padding: 1px 8px;
    border-radius: 6px;
    margin-right: 8px;
}

.tabs >>> .nav-link:not(.active) {
    color: #333;
    font-weight: 500;
    background-color: #f8f8f8;
}

.list-header-group {
    position: sticky;
    top: 15px;
    z-index: 2;
}

.list-group {
    margin-bottom: 20px;
}

.list-group-item:not(.list-header) {
    height: 70px;
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
    position: absolute;
    margin-top: -12px;
    margin-left: -10px;
    height: 49px;
}

.b-skeleton-img {
    height: 45px;
    width: 45px;
    display: inline-block;
    margin-left: -10px;
}

.b-skeleton-text {
    width: 100px;
    margin-left: 12px;
    display: inline-block;
    margin-bottom: 15px;
}

.category-title {
    margin-left: 50px;
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
