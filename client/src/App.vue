<template>
    <div id="app">
        <CustomLoginModal />

        <b-container>
            <CustomHeader />
            <b-row>
                <b-col cols="6">
                    <b-badge
                        variant="primary"
                        >
                        <h2>Picnic Web</h2>
                    </b-badge>
                </b-col>
            </b-row>
            <router-view />
        </b-container>
    </div>
</template>

<script>
import CustomHeader from '@/components/Header';
import CustomLoginModal from '@/components/LoginModal';

export default {
    name: 'App',
    components: {
        CustomHeader,
        CustomLoginModal
    }
}
</script>

<style>
.container {
    margin-top: 20px;
    margin-bottom: 20px;
}

.badge h2 {
    margin: 0;
    line-height: 1;
    cursor: default;
}

.row {
    margin-bottom: 20px;
}
</style>
