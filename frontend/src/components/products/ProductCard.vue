<template>
  <div class="product-card" @click="$emit('click', product)">
    <div class="product-card__image-wrap">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        loading="lazy"
        class="product-card__image"
      />
      <div v-else class="product-card__placeholder">🎆</div>
      <span v-if="product.discount_percentage" class="badge badge--discount product-card__discount">
        {{ product.discount_percentage }}% OFF
      </span>
      <span v-if="product.is_best_seller" class="badge badge--best-seller product-card__best">Best Seller</span>
      <span v-if="product.is_featured" class="badge badge--featured product-card__featured">Featured</span>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">{{ product.name }}</h3>
      <div class="product-card__pricing">
        <span class="product-card__offer">{{ formatPrice(product.offer_price) }}</span>
        <span class="product-card__original">{{ formatPrice(product.original_price) }}</span>
      </div>
      <button
        class="btn btn--sm product-card__btn"
        :class="{ added: justAdded }"
        @click.stop="handleAdd"
      >
        {{ justAdded ? '✓ Added!' : '🛒 Add to Cart' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';

const props = defineProps({
  product: { type: Object, required: true },
});

defineEmits(['click']);

const cartStore = useCartStore();
const justAdded = computed(() => cartStore.justAdded === props.product.id);

function handleAdd() {
  cartStore.addItem(props.product);
}
</script>

<style lang="scss" scoped>
.product-card {
  @include card;
  @include hover-lift;
  cursor: pointer;
  overflow: hidden;

  &__image-wrap {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    background: $background;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &:hover &__image {
    transform: scale(1.05);
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    background: linear-gradient(135deg, $background, #fff5e6);
  }

  &__discount {
    position: absolute;
    top: 10px;
    left: 10px;
  }

  &__best {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  &__featured {
    position: absolute;
    bottom: 10px;
    left: 10px;
  }

  &__body {
    padding: 16px;
  }

  &__name {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.8em;
  }

  &__pricing {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__offer {
    font-size: 1.2rem;
    font-weight: 700;
    color: $primary;
  }

  &__original {
    font-size: 0.85rem;
    color: $text-muted;
    text-decoration: line-through;
  }

  &__btn {
    width: 100%;

    &.added {
      background: #22c55e;
    }
  }
}
</style>
