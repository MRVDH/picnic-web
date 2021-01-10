<template>
    <b-row>
        <b-col cols="6">
            <b-badge
                variant="primary"
                >
                <h2>Picnic Web</h2>
            </b-badge>
        </b-col>
        <b-col cols="6">
            <div class="floating-box">
                <b-button
                    variant="outline"
                    :to="{ name: 'StoreFront' }"
                    >
                    <b-icon
                        icon="shop-window"
                        :class="{ 'text-primary': routeName === 'StoreFront' }"
                        />
                </b-button>
                <b-button
                    variant="outline"
                    :to="{ name: 'Search' }"
                    >
                    <b-icon
                        icon="search"
                        :class="{ 'text-primary': routeName === 'Search' }"
                        />
                </b-button>
                <b-button
                    variant="outline"
                    :to="{ name: 'Cart' }"
                    >
                    <b-icon
                        icon="cart"
                        :class="{ 'text-primary': routeName === 'Cart' }"
                        />
                </b-button>
                <b-button
                    variant="outline"
                    :to="{ name: 'User' }"
                    >
                    <b-icon
                        icon="person"
                        :class="{ 'text-primary': routeName === 'User' }"
                        />
                </b-button>
            </div>
        </b-col>
    </b-row>
</template>

<script>
export default {
    name: 'CustomHeader',
    computed: {
        routeName () {
            return this.$route.name;
        }
    }
}
</script>

<style scoped>
.badge h2 {
    margin: 0;
    line-height: 1;
    cursor: default;
}

.floating-box {
    float: right;
    background: white;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.row {
    margin-bottom: 20px;
}
</style>
