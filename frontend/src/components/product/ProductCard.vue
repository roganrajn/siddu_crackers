<template>
  <div class="product-card" @click="$emit('quick-view', product)">
    <div class="product-card__image-wrap">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        loading="lazy"
        class="product-card__image"
      />
      <div v-else class="product-card__placeholder">🎆</div>

      <div class="product-card__badges">
        <span v-for="tag in topTags" :key="tag" class="badge" :class="`badge--${tag.replace('_','-')}`">
          {{ getTagIcon(tag) }} {{ getTagLabel(tag) }}
        </span>
      </div>

      <span v-if="product.discount_percentage" class="product-card__discount">
        {{ product.discount_percentage }}% OFF
      </span>

      <span v-if="cartQty > 0" class="product-card__in-cart">{{ cartQty }} in cart</span>
    </div>

    <div class="product-card__body">
      <h3 class="product-card__name">{{ product.name }}</h3>
      <div class="product-card__pricing">
        <span class="product-card__original">{{ formatPrice(product.original_price) }}</span>
        <span class="product-card__offer">{{ formatPrice(product.offer_price) }}</span>
      </div>

      <CartQuantityControl
        v-if="cartQty > 0"
        :product="product"
        class="product-card__qty"
      />
      <button
        v-else
        class="btn btn--sm product-card__btn"
        :class="{ added: justAdded }"
        @click.stop="handleAdd"
      >
        {{ justAdded ? '✓ Added!' : '+ Add to Cart' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice, getTagLabel, getTagIcon } from '@/utils/helpers';
import CartQuantityControl from '@/components/cart/CartQuantityControl.vue';

const props = defineProps({ product: { type: Object, required: true } });
defineEmits(['quick-view']);

const cartStore = useCartStore();
const justAdded = computed(() => cartStore.justAdded === props.product.id);
const cartQty = computed(() =>
  cartStore.items.find(i => i.product_id === props.product.id)?.quantity || 0
);

const topTags = computed(() => {
  const tags = [...(props.product.tags || [])];
  if (props.product.is_best_seller && !tags.includes('best_seller')) tags.unshift('best_seller');
  if (props.product.is_featured && !tags.includes('festival_offer')) tags.push('festival_offer');
  return tags.slice(0, 2);
});

function handleAdd() {
  cartStore.addItem(props.product);
}
</script>

<style lang="scss" scoped>
.product-card {
  @include card;
  overflow: hidden;
  cursor: pointer;
  transition: $transition;

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: $shadow-hover;
    .product-card__image { transform: scale(1.06); }
  }

  &__image-wrap {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    background: linear-gradient(135deg, $background-warm, #FEFCF8);
  }

  &__image {
    @include image-cover;
    transition: transform 0.4s ease;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
  }

  &__badges {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    .badge { font-size: 0.65rem; padding: 3px 8px; }
  }

  &__discount {
    position: absolute;
    bottom: 8px;
    right: 8px;
    @include gold-gradient;
    color: $primary-dark;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 800;
    box-shadow: $shadow-gold;
  }

  &__in-cart {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(125, 60, 94, 0.9);
    color: $white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  &__body { padding: 14px; }

  &__name {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.6em;
    line-height: 1.3;
  }

  &__pricing {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__original {
    font-size: 0.8rem;
    color: $text-muted;
    text-decoration: line-through;
  }

  &__offer {
    font-size: 1.2rem;
    font-weight: 800;
    color: $primary;
    background: linear-gradient(135deg, $primary, $secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__btn {
    width: 100%;
    &.added { background: $accent; }
  }

  &__qty {
    width: 100%;
  }
}
</style>
