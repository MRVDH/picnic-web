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
            <b-badge
                v-if="cart && cart.total_price && routeName !== 'Cart'"
                variant="primary"
                pill
                >
                {{ totalCartValue }}
            </b-badge>
        </b-button>
        <b-button
            variant="outline"
            :to="{ name: 'User' }"
            :class="{ 'move-icon' : cart && cart.total_price && routeName !== 'Cart' }"
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
        },
        cart () {
            return this.$store.state.cart;
        },
        totalCartValue () {
            return (this.cart.total_price / 100).toLocaleString('en-EN')
        }
    }
}
</script>

<style scoped lang="scss">
.floating-box {
    float: right;
    background: white;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    position: sticky;
    top: 20px;
    z-index: 10;

    .badge {
        font-size: 11px;
        top: -10px !important;
        left: -12px;
        border: 2px solid white;
        min-width: 41px;
        padding: 1px;
    }

    .move-icon {
        margin-left: -41px;
    }
}
</style>
