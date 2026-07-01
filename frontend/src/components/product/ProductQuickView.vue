<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="product" class="quick-view-overlay" @click.self="close">
        <div class="quick-view">
          <button class="quick-view__close" @click="close">✕</button>
          <div class="quick-view__grid">
            <div class="quick-view__gallery">
              <img
                :src="activeImage"
                :alt="product.name"
                class="quick-view__main-img"
              />
              <div v-if="allImages.length > 1" class="quick-view__thumbs">
                <button
                  v-for="(img, i) in allImages"
                  :key="i"
                  :class="{ active: activeImage === img }"
                  @click="activeImage = img"
                >
                  <img :src="img" :alt="`${product.name} ${i + 1}`" loading="lazy" />
                </button>
              </div>
            </div>
            <div class="quick-view__info">
              <div class="quick-view__tags">
                <span v-for="tag in displayTags" :key="tag" class="badge" :class="`badge--${tag.replace('_','-')}`">
                  {{ getTagIcon(tag) }} {{ getTagLabel(tag) }}
                </span>
              </div>
              <h2>{{ product.name }}</h2>
              <p v-if="product.sku" class="sku">SKU: {{ product.sku }}</p>
              <div class="pricing">
                <span class="offer">{{ formatPrice(product.offer_price) }}</span>
                <span class="original">{{ formatPrice(product.original_price) }}</span>
                <span class="badge badge--discount">{{ product.discount_percentage }}% OFF</span>
              </div>
              <p v-if="product.description" class="desc">{{ product.description }}</p>
              <div v-if="product.categories?.length" class="cats">
                <span v-for="cat in product.categories" :key="cat.id" class="cat-tag">{{ cat.icon || '🎇' }} {{ cat.name }}</span>
              </div>
              <CartQuantityControl
                v-if="cartQty > 0 && product"
                :product="product"
                class="quick-view__qty"
              />
              <button
                v-else
                class="btn btn--large"
                :class="{ added: justAdded }"
                @click="addToCart"
              >
                {{ justAdded ? '✓ Added to Cart!' : '🛒 Add to Cart' }}
              </button>
              <router-link :to="`/product/${product.slug}`" class="view-full" @click="close">View Full Details →</router-link>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import CartQuantityControl from '@/components/cart/CartQuantityControl.vue';
import { formatPrice, getTagLabel, getTagIcon } from '@/utils/helpers';

const uiStore = useUiStore();
const cartStore = useCartStore();

const product = computed(() => uiStore.quickViewProduct);
const activeImage = ref('');
const justAdded = ref(false);

const cartQty = computed(() => {
  if (!product.value) return 0;
  return cartStore.items.find(i => i.product_id === product.value.id)?.quantity || 0;
});

const allImages = computed(() => {
  if (!product.value) return [];
  const imgs = product.value.images?.map(i => i.image_url) || [];
  if (product.value.image_url && !imgs.includes(product.value.image_url)) {
    return [product.value.image_url, ...imgs];
  }
  return imgs.length ? imgs : [];
});

const displayTags = computed(() => {
  const tags = product.value?.tags || [];
  if (product.value?.is_best_seller && !tags.includes('best_seller')) tags.unshift('best_seller');
  return tags.slice(0, 3);
});

watch(product, (p) => {
  if (p) activeImage.value = p.image_url || p.images?.[0]?.image_url || '';
  justAdded.value = false;
});

function close() { uiStore.closeQuickView(); }

function addToCart() {
  cartStore.addItem(product.value);
  justAdded.value = true;
  setTimeout(() => { justAdded.value = false; }, 1500);
}
</script>

<style lang="scss" scoped>
.quick-view-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.quick-view {
  @include card;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: scaleIn 0.3s ease;

  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: $background;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1;
    font-size: 1rem;
    &:hover { background: $primary; color: $white; }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 32px;
  }

  &__main-img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: $radius;
    background: $background;
  }

  &__thumbs {
    display: flex;
    gap: 8px;
    margin-top: 12px;

    button {
      width: 60px;
      height: 60px;
      border: 2px solid $border;
      border-radius: $radius-sm;
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      background: none;
      &.active { border-color: $primary; }
      img { width: 100%; height: 100%; object-fit: cover; }
    }
  }

  &__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  h2 { font-size: 1.5rem; margin-bottom: 8px; }
  .sku { color: $text-muted; font-size: 0.85rem; margin-bottom: 12px; }

  .pricing {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    .offer { font-size: 1.8rem; font-weight: 800; color: $primary; }
    .original { text-decoration: line-through; color: $text-muted; }
  }

  .desc { color: $text-muted; line-height: 1.7; margin-bottom: 16px; font-size: 0.95rem; }

  .cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 20px;
    .cat-tag { padding: 4px 10px; background: $background; border-radius: 12px; font-size: 0.8rem; }
  }

  .btn.added { background: $accent; }
  &__qty { margin-bottom: 4px; }
  .view-full { display: block; text-align: center; margin-top: 12px; color: $accent; font-weight: 600; font-size: 0.9rem; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .quick-view__grid { grid-template-columns: 1fr; padding: 20px; gap: 20px; }
}
</style>
