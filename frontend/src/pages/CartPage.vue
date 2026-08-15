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
              <div class="cart-row__pricing">
                <span class="cart-row__offer">{{ formatPrice(item.price) }}</span>
                <span v-if="item.mrp_price > item.price" class="cart-row__mrp">{{ formatPrice(item.mrp_price) }}</span>
              </div>
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
          <OrderPricingTables :items="cartStore.items" :breakdown="cartStore.pricing" :show-gst="false" />

          <p v-if="!cartStore.meetsMinOrder" class="min-order-warning">
            Add {{ formatPrice(cartStore.minOrderRemaining) }} more to reach minimum order of
            {{ formatPrice(cartStore.pricing.min_order_amount) }}.
          </p>

          <router-link
            v-if="cartStore.meetsMinOrder"
            to="/checkout"
            class="btn btn--large"
          >
            Proceed to Checkout
          </router-link>
          <button v-else class="btn btn--large" disabled>Minimum order not met</button>
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
import OrderPricingTables from '@/components/order/OrderPricingTables.vue';

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
  grid-template-columns: 1fr 420px;
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
  }

  &__pricing {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__offer {
    font-weight: 700;
    color: $primary;
  }

  &__mrp {
    font-size: 0.82rem;
    color: $text-muted;
    text-decoration: line-through;
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
  .btn { margin-top: 12px; }
}

.min-order-warning {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: $radius-sm;
  background: #fff7ed;
  color: #c2410c;
  font-size: 0.88rem;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .cart-content { grid-template-columns: 1fr; }
  .cart-row { flex-wrap: wrap; }
}
</style>
