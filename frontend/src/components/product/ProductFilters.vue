<template>
  <div class="product-filters">
    <div class="filters-row">
      <select v-model="local.category" @change="emitFilters">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.slug">{{ cat.name }}</option>
      </select>

      <select v-model="local.tag" @change="emitFilters">
        <option value="">All Tags</option>
        <option v-for="tag in PRODUCT_TAGS" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
      </select>

      <label class="filter-check">
        <input v-model="local.best_seller" type="checkbox" @change="emitFilters" /> Best Seller
      </label>
      <label class="filter-check">
        <input v-model="local.featured" type="checkbox" @change="emitFilters" /> Featured
      </label>

      <div class="price-range">
        <input v-model.number="local.min_price" type="number" placeholder="Min ₹" @change="emitFilters" />
        <span>–</span>
        <input v-model.number="local.max_price" type="number" placeholder="Max ₹" @change="emitFilters" />
      </div>

      <select v-model="local.sort_by" @change="emitFilters">
        <option value="sort_order">Default</option>
        <option value="name">Name</option>
        <option value="price">Price</option>
        <option value="discount">Discount</option>
      </select>

      <button v-if="hasActive" class="btn btn--sm btn--outline" @click="reset">Clear</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import { PRODUCT_TAGS } from '@/constants';

defineProps({ categories: { type: Array, default: () => [] } });

const uiStore = useUiStore();
const local = reactive({ ...uiStore.filters });

const hasActive = computed(() => uiStore.hasActiveFilters);

function emitFilters() {
  uiStore.updateFilters({ ...local });
}

function reset() {
  uiStore.resetFilters();
  Object.assign(local, uiStore.filters);
}
</script>

<style lang="scss" scoped>
.product-filters {
  margin-bottom: 24px;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;

  select, input[type="number"] {
    padding: 8px 12px;
    border: 2px solid $border;
    border-radius: $radius-sm;
    font-size: 0.85rem;
    background: $white;
  }

  .filter-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }

  .price-range {
    display: flex;
    align-items: center;
    gap: 6px;
    input { width: 80px; }
    span { color: $text-muted; }
  }
}

@media (max-width: 768px) {
  .filters-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    select,
    input[type="number"] {
      width: 100%;
      font-size: 0.8rem;
      padding: 10px 12px;
    }

    .filter-check {
      grid-column: span 1;
      font-size: 0.8rem;
    }

    .price-range {
      grid-column: 1 / -1;
      input { flex: 1; width: auto; min-width: 0; }
    }

    .btn {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
}
</style>
