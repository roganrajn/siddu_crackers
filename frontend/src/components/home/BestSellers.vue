<template>
  <section class="home-section">
    <div class="container">
      <h2 class="section-title">Best Sellers</h2>
      <div class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @quick-view="uiStore.openQuickView($event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useUiStore } from '@/stores/uiStore';
import ProductCard from '@/components/product/ProductCard.vue';

const productStore = useProductStore();
const uiStore = useUiStore();

const products = computed(() =>
  productStore.products.filter(p => p.is_best_seller || p.tags?.includes('best_seller')).slice(0, 8)
);
</script>

<style lang="scss" scoped>
.home-section {
  padding: 56px 0;
  background: linear-gradient(180deg, transparent 0%, rgba(253, 248, 240, 0.5) 100%);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 22px;
}
</style>
