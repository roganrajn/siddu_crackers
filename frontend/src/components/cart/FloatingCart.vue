<template>
  <div>
    <button class="floating-cart" @click="cartStore.toggleDrawer()" aria-label="Open cart">
      <span class="floating-cart__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 3h2.4l2.8 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 6H6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="10" cy="20" r="1.5" fill="currentColor" />
          <circle cx="18" cy="20" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <span v-if="cartStore.itemCount" class="floating-cart__badge">{{ cartStore.itemCount }}</span>
      <span v-if="cartStore.total > 0" class="floating-cart__total">{{ formatPrice(cartStore.total) }}</span>
    </button>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="cartStore.isOpen" class="cart-overlay" @click="cartStore.closeDrawer()"></div>
      </Transition>
      <Transition name="slide">
        <aside v-if="cartStore.isOpen" class="cart-drawer">
          <div class="cart-drawer__header">
            <h2>🛒 Your Cart ({{ cartStore.itemCount }})</h2>
            <button class="cart-drawer__close" @click="cartStore.closeDrawer()">✕</button>
          </div>

          <div v-if="!cartStore.items.length" class="cart-drawer__empty">
            <span>🎆</span>
            <p>Your cart is empty</p>
            <button class="btn" @click="cartStore.closeDrawer()">Continue Shopping</button>
          </div>

          <div v-else class="cart-drawer__items">
            <div v-for="item in cartStore.items" :key="item.product_id" class="cart-item">
              <div class="cart-item__image">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.product_name" loading="lazy" />
                <span v-else>🎆</span>
              </div>
              <div class="cart-item__info">
                <h4>{{ item.product_name }}</h4>
                <p>{{ formatPrice(item.price) }}</p>
              </div>
              <div class="cart-item__qty">
                <button @click="cartStore.updateQuantity(item.product_id, item.quantity - 1)">−</button>
                <span>{{ item.quantity }}</span>
                <button @click="cartStore.updateQuantity(item.product_id, item.quantity + 1)">+</button>
              </div>
              <button class="cart-item__remove" @click="cartStore.removeItem(item.product_id)">🗑️</button>
            </div>
          </div>

          <div v-if="cartStore.items.length" class="cart-drawer__footer">
            <div class="cart-drawer__subtotal">
              <span>Net Amount</span>
              <strong>{{ formatPrice(cartStore.total) }}</strong>
            </div>
            <p v-if="!cartStore.meetsMinOrder" class="cart-drawer__min">
              Min order {{ formatPrice(cartStore.pricing.min_order_amount) }}
            </p>
            <router-link
              v-if="cartStore.meetsMinOrder"
              to="/checkout"
              class="btn btn--large"
              @click="cartStore.closeDrawer()"
            >
              Proceed to Checkout
            </router-link>
            <button v-else class="btn btn--large" disabled>Minimum order not met</button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';

const cartStore = useCartStore();
</script>

<style lang="scss" scoped>
.floating-cart {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 950;
  @include brand-gradient;
  color: $white;
  border: none;
  border-radius: 50px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 6px 25px rgba(125, 60, 94, 0.4);
  transition: $transition;
  font-weight: 700;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(125, 60, 94, 0.5);
  }

  &__icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    color: $primary;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__badge {
    background: $white;
    color: $primary;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  &__total {
    font-size: 0.9rem;
  }
}

.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1100;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100vw;
  background: $white;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0,0,0,0.1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid $border;

    h2 { font-size: 1.2rem; }
  }

  &__close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 8px;
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;

    span { font-size: 4rem; }
    p { color: $text-muted; }
  }

  &__items {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  &__footer {
    padding: 20px;
    border-top: 1px solid $border;
  }

  &__subtotal {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    font-size: 1.1rem;

    strong { color: $primary; font-size: 1.3rem; }
  }

  &__min {
    margin: -8px 0 12px;
    font-size: 0.82rem;
    color: #c2410c;
  }
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid $border;

  &__image {
    width: 50px;
    height: 50px;
    border-radius: $radius-sm;
    overflow: hidden;
    background: $background;
    display: flex;
    align-items: center;
    justify-content: center;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__info {
    flex: 1;

    h4 { font-size: 0.9rem; margin-bottom: 4px; }
    p { color: $primary; font-weight: 600; font-size: 0.85rem; }
  }

  &__qty {
    display: flex;
    align-items: center;
    gap: 8px;

    button {
      width: 28px;
      height: 28px;
      border: 1px solid $border;
      border-radius: 50%;
      background: $white;
      cursor: pointer;
      font-size: 1rem;

      &:hover { border-color: $primary; color: $primary; }
    }

    span { font-weight: 600; min-width: 20px; text-align: center; }
  }

  &__remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.5;

    &:hover { opacity: 1; }
  }
}
</style>
