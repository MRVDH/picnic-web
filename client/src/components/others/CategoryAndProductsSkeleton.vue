<template>
    <div>
        <b-row v-if="includeHeader">
            <b-col cols="12">
                <b-skeleton
                    width="120px"
                    style="margin-bottom: 20px"
                    />
            </b-col>
        </b-row>
        <b-row>
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
export default {
    name: 'CategoryAndProductsSkeleton',
    props: {
        includeHeader: Boolean
    }
}
</script>

<style scoped>
.b-skeleton-img {
    height: 370px;
    margin-bottom: 5px;
}
</style>
