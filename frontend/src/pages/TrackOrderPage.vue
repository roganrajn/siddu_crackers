<template>
  <div class="track-order-page">
    <div class="container">
      <div class="track-card">
        <h1>📦 Track Your Order</h1>
        <p>Enter your order number and phone to check status</p>

        <form @submit.prevent="handleTrack" class="track-form">
          <div class="form-group">
            <label>Order Number</label>
            <input v-model="form.order_number" required placeholder="e.g. SID2026123456" />
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input v-model="form.phone" required type="tel" placeholder="10-digit mobile number" />
          </div>
          <button type="submit" class="btn btn--large" :disabled="loading">
            {{ loading ? 'Checking...' : 'Track Order' }}
          </button>
          <p v-if="error" class="error">{{ error }}</p>
        </form>

        <div v-if="result" class="track-result">
          <div class="result-header">
            <div>
              <small>Order Number</small>
              <strong>{{ result.order.order_number }}</strong>
            </div>
            <div class="status-badge" :class="result.order.status">
              {{ result.order.customer_status }}
            </div>
          </div>

          <div class="result-details">
            <p><strong>Customer:</strong> {{ result.order.customer_name }}</p>
            <p><strong>Total:</strong> {{ formatPrice(result.order.total_amount) }}</p>
            <p><strong>Placed:</strong> {{ new Date(result.order.created_at).toLocaleString('en-IN') }}</p>
          </div>

          <div class="timeline">
            <h3>Order Timeline</h3>
            <div v-for="(step, i) in result.timeline" :key="i" class="timeline-step">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>{{ step.customer_status }}</strong>
                <small>{{ new Date(step.date).toLocaleString('en-IN') }}</small>
                <p v-if="step.note">{{ step.note }}</p>
              </div>
            </div>
          </div>

          <div class="result-items">
            <h3>Items</h3>
            <div v-for="item in result.order.items" :key="item.product_name" class="item-row">
              <span>{{ item.product_name }} × {{ item.quantity }}</span>
              <span>{{ formatPrice(item.subtotal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { formatPrice } from '@/utils/helpers';

const orderStore = useOrderStore();
const loading = ref(false);
const error = ref('');
const result = ref(null);
const form = ref({ order_number: '', phone: '' });

async function handleTrack() {
  loading.value = true;
  error.value = '';
  result.value = null;
  try {
    result.value = await orderStore.trackOrder(form.value.order_number, form.value.phone);
  } catch (e) {
    error.value = e.response?.data?.error || 'Could not find order';
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.track-order-page {
  padding: 40px 0 60px;
  min-height: 70vh;
}

.track-card {
  @include card;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 32px;

  h1 { font-size: 1.75rem; margin-bottom: 8px; }
  > p { color: $text-muted; margin-bottom: 28px; }
}

.track-form { margin-bottom: 32px; }
.error { color: #ef4444; margin-top: 12px; text-align: center; }

.track-result {
  border-top: 2px solid $border;
  padding-top: 28px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  small { display: block; color: $text-muted; font-size: 0.8rem; }
  strong { font-size: 1.2rem; color: $primary; }
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  background: #dbeafe;
  color: #2563eb;

  &.completed { background: #d1fae5; color: #059669; }
  &.cancelled { background: #fee2e2; color: #dc2626; }
  &.confirmed, &.packed { background: #d1fae5; color: #059669; }
}

.result-details {
  background: $background;
  padding: 16px;
  border-radius: $radius-sm;
  margin-bottom: 24px;
  p { margin-bottom: 6px; font-size: 0.9rem; }
}

.timeline {
  margin-bottom: 24px;
  h3 { margin-bottom: 16px; font-size: 1rem; }
}

.timeline-step {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  position: relative;

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 20px;
    bottom: 0;
    width: 2px;
    background: $border;
  }
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: $primary;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-content {
  strong { display: block; }
  small { color: $text-muted; font-size: 0.8rem; }
  p { color: $text-muted; font-size: 0.85rem; margin-top: 4px; }
}

.result-items {
  h3 { margin-bottom: 12px; font-size: 1rem; }
  .item-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid $border;
    font-size: 0.9rem;
  }
}
</style>
