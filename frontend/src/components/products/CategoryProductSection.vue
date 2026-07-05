<template>
  <section v-if="products.length" :id="`category-${category.slug}`" class="category-section">
    <div class="category-section__header">
      <h2 class="section-title">
        <span v-if="category.icon">{{ category.icon }}</span>
        {{ category.name }}
      </h2>
      <span class="category-section__count">{{ products.length }} products</span>
    </div>
    <div v-if="products.length" class="category-section__grid">
      <div
        v-for="(product, index) in visibleProducts"
        :key="product.id"
        v-scroll-reveal="index * 80"
        class="category-section__item"
      >
        <ProductCard
          :product="product"
          @quick-view="$emit('quick-view', $event)"
        />
      </div>
    </div>
    <div v-if="products.length > initialLimit" class="category-section__more">
      <button class="btn btn--outline" @click="expanded = !expanded">
        {{ expanded ? 'Show Less' : `View More (${products.length - initialLimit} more)` }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import ProductCard from '@/components/product/ProductCard.vue';

const props = defineProps({
  category: { type: Object, required: true },
  products: { type: Array, default: () => [] },
  initialLimit: { type: Number, default: 8 },
});

defineEmits(['quick-view']);

const expanded = ref(false);
const visibleProducts = computed(() =>
  expanded.value ? props.products : props.products.slice(0, props.initialLimit)
);
</script>

<style lang="scss" scoped>
.category-section {
  margin-bottom: 48px;
  scroll-margin-top: calc(var(--site-header-height, #{$top-bar-total}) + #{$sticky-category-bar-height} + 12px);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  &__count { color: $text-muted; font-size: 0.9rem; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  &__item {
    min-width: 0;
  }

  &__more { text-align: center; margin-top: 24px; }
}

@media (max-width: 480px) {
  .category-section__grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
