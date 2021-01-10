<template>
    <div id="app">
        <CustomLoginModal />

        <b-container>
            <CustomHeader />
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
</style>
