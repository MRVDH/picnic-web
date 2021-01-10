<template>
    <div>
        <b-row>
            <b-col cols="12">
                <b-input-group>
                    <b-input-group-prepend is-text>
                        <b-icon icon="search" />
                    </b-input-group-prepend>

                    <b-form-input
                        v-model="searchText"
                        type="search"
                        placeholder="Welk product zoek je?"
                        />
                </b-input-group>
            </b-col>
        </b-row>

        <div v-if="categories && categories.length">
            <b-row
                v-for="category in categories"
                :key="category.id"
                >
                <b-col cols="12">
                    {{ category.name }}
                </b-col>
            </b-row>
        </div>
    </div>
</template>

<script>
import ApiService from '@/services/ApiService';

export default {
    name: 'Search',
    data () {
        return {
            searchText: "",
            categories: []
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
            ApiService.getCategories(3).then(res => {
                this.categories = res.data.filter(x => x.is_included_in_category_tree);
            });
        }
    }
}
</script>

<style scoped>
.input-group-text {
    border-right: none;
    background: #fff;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}

.form-control {
    border-left: none;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}
</style>
