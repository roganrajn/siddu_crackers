<template>
  <div class="checkout-page">
    <div class="container">
      <h1 class="page-title">📋 Checkout</h1>

      <div class="checkout-grid">
        <div class="order-summary">
          <h2>Order Summary</h2>
          <div v-for="item in cartStore.items" :key="item.product_id" class="summary-item">
            <div class="summary-item__thumb">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.product_name" loading="lazy" />
              <span v-else>🎆</span>
            </div>
            <div class="summary-item__info">
              <span class="summary-item__name">{{ item.product_name }} × {{ item.quantity }}</span>
              <span class="summary-item__unit">{{ formatPrice(item.price) }} / pc</span>
            </div>
            <span class="summary-item__total">{{ formatPrice(item.price * item.quantity) }}</span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <strong>{{ formatPrice(cartStore.total) }}</strong>
          </div>
        </div>

        <form class="checkout-form" @submit.prevent="handleSubmit">
          <h2>Customer Details</h2>

          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.customer_name" required placeholder="Your full name" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Phone / WhatsApp *</label>
              <input
                v-model="form.phone"
                required
                type="tel"
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
              />
            </div>
            <div class="form-group">
              <label>Email (Optional)</label>
              <input v-model="form.email" type="email" placeholder="your@email.com" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>State *</label>
              <select v-model="form.state" required>
                <option value="">Select State</option>
                <option v-for="s in INDIAN_STATES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>City *</label>
              <input v-model="form.city" required placeholder="Your city" />
            </div>
          </div>

          <div class="form-group">
            <label>Address *</label>
            <textarea v-model="form.address" required placeholder="Full delivery address" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Pincode *</label>
              <input v-model="form.pincode" required placeholder="6-digit pincode" pattern="[0-9]{6}" />
            </div>
            <div class="form-group">
              <label>Remarks</label>
              <input v-model="form.remarks" placeholder="Any special instructions" />
            </div>
          </div>

          <div class="form-submit">
            <button type="submit" class="btn btn--large" :disabled="submitting">
              {{ submitting ? 'Placing Order...' : '🎆 Submit Order' }}
            </button>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { formatPrice, INDIAN_STATES } from '@/utils/helpers';

const router = useRouter();
const cartStore = useCartStore();
const orderStore = useOrderStore();

const submitting = ref(false);
const error = ref('');

const form = ref({
  customer_name: '',
  phone: '',
  email: '',
  state: '',
  city: '',
  address: '',
  pincode: '',
  remarks: '',
});

onMounted(() => {
  if (!cartStore.items.length) {
    router.push('/cart');
  }
});

async function handleSubmit() {
  submitting.value = true;
  error.value = '';
  try {
    const orderData = {
      ...form.value,
      whatsapp: form.value.phone,
      items: cartStore.items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        price: i.price,
        quantity: i.quantity,
      })),
    };
    await orderStore.submitOrder(orderData);
    cartStore.clearCart();
    router.push('/order-success');
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to place order. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.checkout-page {
  padding: 32px 0 60px;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 32px;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
  align-items: start;
}

.order-summary {
  @include card;
  padding: 24px;
  position: sticky;
  top: calc($header-height + 20px);

  h2 { margin-bottom: 20px; font-size: 1.2rem; }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid $border;
    font-size: 0.9rem;

    &__thumb {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: $radius-sm;
      overflow: hidden;
      background: $background;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__name {
      font-weight: 500;
      line-height: 1.3;
    }

    &__unit {
      font-size: 0.8rem;
      color: $text-muted;
    }

    &__total {
      flex-shrink: 0;
      font-weight: 600;
      color: $text-dark;
    }
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    margin-top: 8px;
    font-size: 1.1rem;

    strong { color: $primary; font-size: 1.4rem; }
  }
}

.checkout-form {
  @include card;
  padding: 32px;

  h2 { margin-bottom: 24px; font-size: 1.2rem; }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-submit {
  display: flex;
  justify-content: center;
  margin-top: 8px;

  .btn { min-width: 220px; }
}

.error-msg {
  color: #ef4444;
  margin-top: 12px;
  text-align: center;
}

@media (max-width: 768px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
