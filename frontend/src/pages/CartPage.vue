<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">🛒 Your Cart</h1>

      <div v-if="!cartStore.items.length" class="empty-cart">
        <span>🎆</span>
        <h2>Your cart is empty</h2>
        <p>Add some crackers to get started!</p>
        <router-link to="/" class="btn">Browse Products</router-link>
      </div>

      <div v-else class="cart-content">
        <div class="cart-actions-top">
          <router-link to="/" class="btn btn--outline btn--sm">← Continue Shopping</router-link>
        </div>
        <div class="cart-items">
          <div v-for="item in cartStore.items" :key="item.product_id" class="cart-row">
            <div class="cart-row__image">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.product_name" loading="lazy" />
              <span v-else>🎆</span>
            </div>
            <div class="cart-row__info">
              <h3>{{ item.product_name }}</h3>
              <p>{{ formatPrice(item.price) }} each</p>
            </div>
            <div class="cart-row__qty">
              <button @click="cartStore.updateQuantity(item.product_id, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button @click="cartStore.updateQuantity(item.product_id, item.quantity + 1)">+</button>
            </div>
            <div class="cart-row__total">{{ formatPrice(item.price * item.quantity) }}</div>
            <button class="cart-row__remove" @click="cartStore.removeItem(item.product_id)">🗑️</button>
          </div>
        </div>

        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-row">
            <span>Items ({{ cartStore.itemCount }})</span>
            <span>{{ formatPrice(cartStore.total) }}</span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <strong>{{ formatPrice(cartStore.total) }}</strong>
          </div>
          <router-link to="/checkout" class="btn btn--large">Proceed to Checkout</router-link>
          <button class="btn btn--outline btn--large" @click="cartStore.clearCart()">Clear Cart</button>
          <router-link to="/" class="btn btn--secondary btn--large">Continue Shopping</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';

const cartStore = useCartStore();
</script>

<style lang="scss" scoped>
.cart-page { padding: 32px 0 60px; }
.cart-actions-top { margin-bottom: 20px; }

.page-title {
  font-size: 1.75rem;
  margin-bottom: 32px;
}

.empty-cart {
  text-align: center;
  padding: 80px 20px;

  span { font-size: 5rem; display: block; margin-bottom: 16px; }
  h2 { margin-bottom: 8px; }
  p { color: $text-muted; margin-bottom: 24px; }
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 32px;
  align-items: start;
}

.cart-row {
  @include card;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;

  &__image {
    width: 70px;
    height: 70px;
    border-radius: $radius-sm;
    overflow: hidden;
    background: $background;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__info {
    flex: 1;
    h3 { font-size: 1rem; margin-bottom: 4px; }
    p { color: $text-muted; font-size: 0.85rem; }
  }

  &__qty {
    display: flex;
    align-items: center;
    gap: 12px;

    button {
      width: 32px;
      height: 32px;
      border: 2px solid $border;
      border-radius: 50%;
      background: $white;
      cursor: pointer;
      font-size: 1.1rem;
      &:hover { border-color: $primary; }
    }
    span { font-weight: 700; min-width: 24px; text-align: center; }
  }

  &__total {
    font-weight: 700;
    color: $primary;
    min-width: 80px;
    text-align: right;
  }

  &__remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    opacity: 0.5;
    &:hover { opacity: 1; }
  }
}

.cart-summary {
  @include card;
  padding: 24px;
  position: sticky;
  top: calc($header-height + 20px);

  h3 { margin-bottom: 20px; }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    color: $text-muted;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    padding: 16px 0;
    border-top: 2px solid $border;
    margin-bottom: 20px;
    font-size: 1.1rem;

    strong { color: $primary; font-size: 1.4rem; }
  }

  .btn { margin-bottom: 12px; }
}

@media (max-width: 768px) {
  .cart-content { grid-template-columns: 1fr; }
  .cart-row { flex-wrap: wrap; }
}
</style>
