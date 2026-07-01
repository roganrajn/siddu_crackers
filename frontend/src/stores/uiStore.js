import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const searchQuery = ref('');
  const quickViewProduct = ref(null);
  const filters = ref({
    category: '',
    featured: false,
    best_seller: false,
    tag: '',
    min_price: null,
    max_price: null,
    sort_by: 'sort_order',
    sort_dir: 'asc',
  });

  function setSearch(query) {
    searchQuery.value = query;
  }

  function openQuickView(product) {
    quickViewProduct.value = product;
  }

  function closeQuickView() {
    quickViewProduct.value = null;
  }

  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      category: '', featured: false, best_seller: false, tag: '',
      min_price: null, max_price: null, sort_by: 'sort_order', sort_dir: 'asc',
    };
  }

  const hasActiveFilters = computed(() =>
    filters.value.category || filters.value.featured || filters.value.best_seller ||
    filters.value.tag || filters.value.min_price || filters.value.max_price
  );

  return { searchQuery, quickViewProduct, filters, hasActiveFilters, setSearch, openQuickView, closeQuickView, updateFilters, resetFilters };
});
