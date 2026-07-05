<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { useTheme } from '@/composables/useTheme';

const settingsStore = useSettingsStore();
const productStore = useProductStore();
const cartStore = useCartStore();
useTheme();

onMounted(async () => {
  settingsStore.fetchSettings();
  await productStore.fetchProducts();
  cartStore.syncWithCatalog(productStore.products);
});
</script>
