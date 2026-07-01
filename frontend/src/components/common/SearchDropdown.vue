<template>
  <div class="search-dropdown" ref="root">
    <div class="search-dropdown__input-wrap">
      <input
        v-model="query"
        type="search"
        placeholder="Search crackers..."
        @input="onInput"
        @focus="showResults = true"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="close"
      />
      <span class="search-icon">🔍</span>
    </div>

    <Transition name="fade">
      <div v-if="showResults && (suggestions.length || query.length >= 2)" class="search-dropdown__results">
        <div v-if="loading" class="search-dropdown__loading">Searching...</div>
        <template v-else-if="suggestions.length">
          <button
            v-for="(item, i) in suggestions"
            :key="item.id"
            class="search-dropdown__item"
            :class="{ highlighted: i === highlightIndex }"
            @click="selectItem(item)"
          >
            <span class="item-icon">{{ item.image_url ? '🖼️' : '🎆' }}</span>
            <div class="item-info">
              <strong>{{ item.name }}</strong>
              <small>{{ formatPrice(item.offer_price) }}</small>
            </div>
          </button>
        </template>
        <div v-else-if="query.length >= 2" class="search-dropdown__empty">No products found</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';
import { useUiStore } from '@/stores/uiStore';
import { useProductStore } from '@/stores/productStore';
import { formatPrice, debounce } from '@/utils/helpers';

const uiStore = useUiStore();
const productStore = useProductStore();
const root = ref(null);
const query = ref('');
const suggestions = ref([]);
const showResults = ref(false);
const loading = ref(false);
const highlightIndex = ref(0);

const fetchSuggestions = debounce(async () => {
  if (query.value.length < 2) {
    suggestions.value = [];
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.get('/products/search/suggest', { params: { q: query.value } });
    suggestions.value = data;
    highlightIndex.value = 0;
  } finally {
    loading.value = false;
  }
}, 250);

function onInput() {
  uiStore.setSearch(query.value);
  fetchSuggestions();
  showResults.value = true;
}

async function selectItem(item) {
  try {
    const full = await productStore.fetchProduct(item.slug);
    uiStore.openQuickView(full);
  } catch {
    uiStore.openQuickView(item);
  }
  close();
}

function selectHighlighted() {
  if (suggestions.value[highlightIndex.value]) selectItem(suggestions.value[highlightIndex.value]);
}

function highlightNext() {
  highlightIndex.value = Math.min(highlightIndex.value + 1, suggestions.value.length - 1);
}

function highlightPrev() {
  highlightIndex.value = Math.max(highlightIndex.value - 1, 0);
}

function close() {
  showResults.value = false;
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) close();
}

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>

<style lang="scss" scoped>
.search-dropdown {
  width: 100%;
  position: relative;

  &__input-wrap {
    position: relative;
    input {
      width: 100%;
      padding: 11px 16px 11px 42px;
      border: 2px solid rgba(125, 60, 94, 0.12);
      border-radius: 25px;
      background: $white;
      box-shadow: 0 2px 8px rgba(61, 31, 48, 0.06);
      transition: $transition;

      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba(125, 60, 94, 0.1);
      }
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  &__results {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: $white;
    border-radius: $radius;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    z-index: 100;
    max-height: 360px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: $transition;
    border-bottom: 1px solid $border;

    &:hover, &.highlighted { background: $background; }
    .item-icon { font-size: 1.2rem; }
    .item-info {
      strong { display: block; font-size: 0.9rem; }
      small { color: $primary; font-weight: 600; }
    }
  }

  &__loading, &__empty {
    padding: 16px;
    text-align: center;
    color: $text-muted;
    font-size: 0.9rem;
  }
}
</style>
