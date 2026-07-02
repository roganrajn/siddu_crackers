<template>
  <div class="home">
    <HeroSlider />
    <SpecialOffers />

    <section id="categories" class="categories-section">
      <div class="container">
        <h2 class="section-title">Popular Categories</h2>
        <div class="categories-grid">
          <CategoryCard
            v-for="cat in categoriesWithProducts"
            :key="cat.id"
            :category="cat"
            @select="scrollToCategory"
          />
        </div>
      </div>
    </section>

    <StickyCategoryBar
      :categories="categoriesWithProducts"
      :active-slug="activeCategory"
      :is-visible="showStickyBar"
      @select="scrollToCategory"
    />

    <section id="products" class="products-section">
      <div class="container">
        <h2 class="section-title">All Products</h2>
        <ProductFilters :categories="categories" />

        <div v-if="loading" class="loading-grid">
          <div v-for="n in 8" :key="n" class="skeleton" style="height: 300px;"></div>
        </div>
        <template v-else>
          <CategoryProductSection
            v-for="cat in visibleCategories"
            :key="cat.id"
            :category="cat"
            :products="getProductsByCategory(cat.slug)"
            @quick-view="uiStore.openQuickView"
          />
          <div v-if="searchQuery && !hasAnyProducts" class="no-results">
            <span>🔍</span>
            <p>No products found{{ searchQuery ? ` for "${searchQuery}"` : '' }}</p>
            <button class="btn btn--outline" @click="uiStore.resetFilters(); uiStore.setSearch('')">Clear Filters</button>
          </div>
        </template>
      </div>
    </section>

    <BestSellers />

    <WhyUs />
    <ReviewsSection />
    <FaqSection />

    <ProductQuickView />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';
import { useUiStore } from '@/stores/uiStore';
import HeroSlider from '@/components/home/HeroSlider.vue';
import SpecialOffers from '@/components/home/SpecialOffers.vue';
import BestSellers from '@/components/home/BestSellers.vue';
import WhyUs from '@/components/home/WhyUs.vue';
import ReviewsSection from '@/components/home/ReviewsSection.vue';
import FaqSection from '@/components/home/FaqSection.vue';
import CategoryCard from '@/components/category/CategoryCard.vue';
import StickyCategoryBar from '@/components/categories/StickyCategoryBar.vue';
import CategoryProductSection from '@/components/products/CategoryProductSection.vue';
import ProductFilters from '@/components/product/ProductFilters.vue';
import ProductQuickView from '@/components/product/ProductQuickView.vue';

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const uiStore = useUiStore();

const showStickyBar = ref(false);
const activeCategory = ref('');

const categories = computed(() => categoryStore.categories);
const loading = computed(() => categoryStore.loading || productStore.loading);
const searchQuery = computed(() => uiStore.searchQuery);
const filters = computed(() => uiStore.filters);

const filteredProducts = computed(() => {
  let list = productStore.products;
  const q = searchQuery.value?.toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.categories?.some(c => c.name.toLowerCase().includes(q))
    );
  }
  const f = filters.value;
  if (f.category) list = list.filter(p => p.categories?.some(c => c.slug === f.category));
  if (f.featured) list = list.filter(p => p.is_featured);
  if (f.best_seller) list = list.filter(p => p.is_best_seller || p.tags?.includes('best_seller'));
  if (f.tag) list = list.filter(p => p.tags?.includes(f.tag));
  if (f.min_price) list = list.filter(p => parseFloat(p.offer_price) >= f.min_price);
  if (f.max_price) list = list.filter(p => parseFloat(p.offer_price) <= f.max_price);
  return list;
});

const visibleCategories = computed(() => {
  const withProducts = categories.value.filter(
    (cat) => getProductsByCategory(cat.slug).length > 0
  );
  if (filters.value.category) {
    return withProducts.filter((c) => c.slug === filters.value.category);
  }
  return withProducts;
});

const categoriesWithProducts = computed(() =>
  categories.value.filter((cat) => getProductsByCategory(cat.slug).length > 0)
);

const hasAnyProducts = computed(() =>
  visibleCategories.value.some(cat => getProductsByCategory(cat.slug).length > 0)
);

function getProductsByCategory(slug) {
  return filteredProducts.value.filter(p => p.categories?.some(c => c.slug === slug));
}

function scrollToCategory(cat) {
  activeCategory.value = cat.slug;
  const el = document.getElementById(`category-${cat.slug}`);
  if (!el) return;

  const headerHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')
  ) || 124;
  const stickyOffset = showStickyBar.value ? 52 : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - stickyOffset - 12;

  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function handlePageScroll() {
  showStickyBar.value = window.scrollY > 600;
}

function loadProducts() {
  const f = filters.value;
  productStore.fetchProducts({
    search: searchQuery.value || undefined,
    category: f.category || undefined,
    featured: f.featured ? 'true' : undefined,
    best_seller: f.best_seller ? 'true' : undefined,
    tag: f.tag || undefined,
    min_price: f.min_price || undefined,
    max_price: f.max_price || undefined,
    sort_by: f.sort_by,
    sort_dir: f.sort_dir,
  });
}

watch([searchQuery, filters], loadProducts, { deep: true });

onMounted(async () => {
  window.addEventListener('scroll', handlePageScroll, { passive: true });
  await categoryStore.fetchCategories();
  await loadProducts();
});

onUnmounted(() => window.removeEventListener('scroll', handlePageScroll));
</script>

<style lang="scss" scoped>
.categories-section {
  padding: 40px 0 28px;
  background: linear-gradient(180deg, rgba(253,248,240,0.3) 0%, transparent 100%);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 18px;
}

.products-section {
  padding: 32px 0 48px;
}
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
  span { font-size: 3rem; display: block; margin-bottom: 12px; }
  .btn { margin-top: 16px; }
}
</style>
