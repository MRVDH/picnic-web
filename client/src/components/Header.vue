<template>
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
.floating-box {
    float: right;
    background: white;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    position: sticky;
    top: 20px;
    z-index: 10;
}
</style>
