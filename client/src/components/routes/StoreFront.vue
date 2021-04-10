<template>
    <div class="d-none d-md-block">
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
                            :disabled="item.id === 'purchases' && !loggedIn"
                            @click="selectTopMenuItem(item)"
                            />
                    </b-tabs>
                </div>
                <div v-else>
                    <b-skeleton type="button" />
                    <b-skeleton type="button" />
                    <b-skeleton type="button" />
                    <b-skeleton type="button" />
                </div>
            </b-col>
        </b-row>

        <CustomCategoryAndProductsSkeleton
            v-if="!selectedTopMenuItem"
            :include-header="true"
            />

        <div v-if="selectedTopMenuItem">
            <CustomCategoryAndProducts
                v-for="category in selectedTopMenuItem.items"
                :key="category.id"
                :category="category"
                :parent-id="selectedTopMenuItem.id"
                />
        </div>
    </div>
</template>

<script>
import ApiService from '@/services/ApiService';

import CustomCategoryAndProducts from '@/components/others/CategoryAndProducts';
import CustomCategoryAndProductsSkeleton from '@/components/others/CategoryAndProductsSkeleton';

export default {
    name: 'StoreFront',
    components: {
        CustomCategoryAndProducts,
        CustomCategoryAndProductsSkeleton
    },
    data () {
        return {
            topMenuItems: [],
            selectedTopMenuItem: null
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
        },
        $route (to, from) {
            if (from.name === "StoreFront" && to.name === "StoreFront" && from.params.listId && !to.params.listId) {
                this.selectTopMenuItem(this.topMenuItems[this.loggedIn ? 0 : 1]);
            }
            console.log(from, to);
        }
    },
    mounted () {
        this.getLists();
    },
    methods: {
        getLists () {
            ApiService.getLists().then((res) => {
                this.topMenuItems = res.data.filter(x => !x.is_included_in_category_tree && !x.hidden && x.items.length > 0);
                this.selectedTopMenuItem = this.topMenuItems.find(x => x.id === this.$route.params.listId) || this.topMenuItems[0];

                if (!this.loggedIn) {
                    this.topMenuItems.unshift({
                        id: "purchases",
                        name: "Besteld"
                    });
                }

                if (this.selectedTopMenuItem.id !== "purchases") {
                    this.selectTopMenuItem(this.selectedTopMenuItem);
                }
            });
        },
        selectTopMenuItem (item) {
            if (this.$route.params.listId !== item.id) {
                this.$router.push({ name: 'StoreFront', params: { listId: item.id } });
            }

            if (!this.loggedIn && item.id === "purchases") {
                return;
            }

            scrollTo(0, 0);

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
.b-skeleton-button {
    display: inline-block;
    margin-right: 10px;
    line-height: 2.0;
}

.b-skeleton-img {
    height: 370px;
    margin-bottom: 5px;
}

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

.floating-box >>> .nav-item a.disabled {
    color: #bbb;
}

.top-menu-items {
    margin-bottom: 20px;
    position: sticky;
    top: 20px;
    z-index: 2;
}
</style>
