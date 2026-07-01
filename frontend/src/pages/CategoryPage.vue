<template>
  <div class="category-page">
    <div class="container">
      <h1 class="page-title">{{ category?.name || 'Category' }}</h1>
      <div class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @click="$router.push(`/product/${product.slug}`)"
        />
      </div>
      <div v-if="!products.length && !loading" class="no-results">
        <p>No products in this category yet.</p>
        <router-link to="/" class="btn">Back to Home</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';
import ProductCard from '@/components/products/ProductCard.vue';

const route = useRoute();
const categoryStore = useCategoryStore();
const productStore = useProductStore();

const category = ref(null);
const products = ref([]);
const loading = ref(true);

onMounted(async () => {
  await categoryStore.fetchCategories();
  category.value = categoryStore.categories.find(c => c.slug === route.params.slug);
  products.value = await productStore.fetchProducts({ category: route.params.slug });
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.category-page { padding: 32px 0 60px; }
.page-title { font-size: 1.75rem; margin-bottom: 32px; }
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.no-results { text-align: center; padding: 60px; color: $text-muted; }
</style>
