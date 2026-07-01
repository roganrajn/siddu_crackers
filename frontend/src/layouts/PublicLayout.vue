<template>
  <div class="public-layout">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
    <FloatingCart />
    <WhatsAppButton />
  </div>
</template>

<script setup>
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import FloatingCart from '@/components/cart/FloatingCart.vue';
import WhatsAppButton from '@/components/common/WhatsAppButton.vue';
</script>

<style lang="scss" scoped>
.main-content {
  min-height: calc(100vh - 200px);
  padding-top: var(--site-header-height, #{$top-bar-total});
}
</style>
