<template>
  <div class="qty-control" @click.stop>
    <button
      type="button"
      class="qty-control__btn"
      aria-label="Decrease quantity"
      @click="decrease"
    >−</button>
    <span class="qty-control__value">{{ quantity }}</span>
    <button
      type="button"
      class="qty-control__btn"
      aria-label="Increase quantity"
      @click="increase"
    >+</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCartStore } from '@/stores/cartStore';

const props = defineProps({
  product: { type: Object, required: true },
  size: { type: String, default: 'md' }, // sm | md
});

const cartStore = useCartStore();

const quantity = computed(() =>
  cartStore.items.find(i => i.product_id === props.product.id)?.quantity || 0
);

function increase() {
  if (quantity.value === 0) {
    cartStore.addItem(props.product);
  } else {
    cartStore.updateQuantity(props.product.id, quantity.value + 1);
  }
}

function decrease() {
  cartStore.updateQuantity(props.product.id, quantity.value - 1);
}
</script>

<style lang="scss" scoped>
.qty-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: $background;
  border: 2px solid $primary;
  border-radius: $radius-sm;
  overflow: hidden;
  min-height: 36px;

  &__btn {
    flex: 1;
    border: none;
    background: transparent;
    color: $primary;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    padding: 8px 4px;
    transition: $transition;
    line-height: 1;

    &:hover {
      background: $primary;
      color: $white;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &__value {
    flex: 1;
    text-align: center;
    font-weight: 700;
    font-size: 0.95rem;
    color: $primary;
    min-width: 28px;
    user-select: none;
  }
}
</style>
