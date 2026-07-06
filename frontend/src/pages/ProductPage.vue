<template>
  <div class="product-page">
    <div class="container" v-if="product">
      <div class="product-detail">
        <div class="product-detail__image">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" />
          <div v-else class="placeholder">🎆</div>
          <span v-if="product.is_best_seller" class="badge badge--best-seller">Best Seller</span>
        </div>
        <div class="product-detail__info">
          <h1>{{ product.name }}</h1>
          <p v-if="product.sku" class="sku">SKU: {{ product.sku }}</p>
          <div class="pricing">
            <span class="offer-price">{{ formatPrice(product.offer_price) }}</span>
            <span class="original-price">{{ formatPrice(product.original_price) }}</span>
            <span class="badge badge--discount">{{ product.discount_percentage }}% OFF</span>
          </div>
          <p v-if="product.description" class="description">{{ product.description }}</p>
          <div class="categories-tags">
            <router-link
              v-for="cat in product.categories"
              :key="cat.id"
              :to="`/category/${cat.slug}`"
              class="tag"
            >{{ cat.name }}</router-link>
          </div>
          <CartQuantityControl
            v-if="cartQty > 0"
            :product="product"
            class="product-detail__qty"
          />
          <button v-else class="btn btn--large" @click="cartStore.addItem(product)">
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
    <div v-else class="loading container">
      <div class="skeleton" style="height: 400px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';
import CartQuantityControl from '@/components/cart/CartQuantityControl.vue';

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();
const product = ref(null);

const cartQty = computed(() => {
  if (!product.value) return 0;
  return cartStore.items.find(i => i.product_id === product.value.id)?.quantity || 0;
});

onMounted(async () => {
  product.value = await productStore.fetchProduct(route.params.slug);
});
</script>

<style lang="scss" scoped>
.product-page { padding: 32px 0 60px; }

.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;

  &__image {
    @include card;
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
    .placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 8rem; background: $background;
    }
    .badge { position: absolute; top: 16px; left: 16px; }
  }

  &__info {
    h1 { font-size: 2rem; margin-bottom: 8px; }
    .sku { color: $text-muted; margin-bottom: 16px; }
  }
}

.pricing {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  .offer-price { font-size: 2rem; font-weight: 800; color: $primary; }
  .original-price { font-size: 1.2rem; color: $text-muted; text-decoration: line-through; }
}

.description {
  margin: 24px 0;
  line-height: 1.8;
  color: $text-muted;
}

.categories-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  .tag {
    padding: 6px 14px;
    background: $background;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary;
    transition: $transition;
    &:hover { background: $primary; color: $white; }
  }

  &__qty { max-width: 200px; margin-top: 8px; }
}

@media (max-width: 768px) {
  .product-detail { grid-template-columns: 1fr; gap: 24px; }
}
</style>
