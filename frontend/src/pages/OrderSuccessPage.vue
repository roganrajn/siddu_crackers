<template>
  <div class="success-page">
    <div class="container">
      <div v-if="!hasOrder" class="success-card success-card--empty">
        <div class="success-icon">📦</div>
        <h1>No Order Found</h1>
        <p>We couldn't find your recent order. It may have expired from this session.</p>
        <router-link to="/" class="btn btn--large">Continue Shopping</router-link>
      </div>

      <div v-else class="success-card">
        <div class="success-icon">✅</div>
        <h1>Thank You!</h1>
        <p class="success-msg">Your order has been received successfully.</p>
        <p class="success-sub">We will contact you shortly to confirm your order.</p>

        <div class="order-info">
          <div class="order-info__item">
            <span>Order Number</span>
            <strong>{{ orderNum }}</strong>
          </div>
          <div class="order-info__item">
            <span>Total Amount</span>
            <strong>{{ formatPrice(orderTotal) }}</strong>
          </div>
          <div v-if="gstStatusLabel" class="order-info__item order-info__item--wide">
            <span>GST Status</span>
            <strong>{{ gstStatusLabel }}</strong>
          </div>
          <div v-if="gstNumber" class="order-info__item order-info__item--wide">
            <span>GSTIN</span>
            <strong>{{ gstNumber }}</strong>
          </div>
        </div>

        <div v-if="orderItems.length || orderBreakdown" class="order-summary">
          <h3>Order Summary</h3>
          <OrderPricingTables
            :items="orderItems"
            :breakdown="orderBreakdown"
            :fallback-total="orderTotal"
          />
        </div>

        <p class="response-time">
          ⏱ Estimated confirmation: {{ settings.confirmation_time || 'Within 2 hours' }}
        </p>

        <button class="btn btn--large btn-whatsapp" @click="handleWhatsAppConfirm">
          💬 Chat with Us on WhatsApp
        </button>

        <p v-if="whatsappError" class="whatsapp-error">{{ whatsappError }}</p>

        <div class="contact-cards">
          <a :href="phoneLink" class="contact-card">
            <span>📞</span>
            <div>
              <small>Customer Care</small>
              <strong>{{ settings.phone }}</strong>
            </div>
          </a>
          <a :href="whatsappGeneralLink" target="_blank" rel="noopener" class="contact-card">
            <span>💬</span>
            <div>
              <small>WhatsApp</small>
              <strong>{{ settings.whatsapp }}</strong>
            </div>
          </a>
        </div>

        <div class="success-actions">
          <router-link to="/" class="btn btn--outline">Continue Shopping</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatPrice, getPhoneLink, getWhatsAppLink, getOrderWhatsAppMessage } from '@/utils/helpers';
import { getStoredOrderBreakdown, getGstStatusLabel } from '@/utils/orderPricing';
import OrderPricingTables from '@/components/order/OrderPricingTables.vue';
import { openWhatsApp } from '@/services/whatsapp.service';

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const whatsappError = ref('');

const orderData = computed(() => orderStore.lastOrder);
const settings = computed(() => settingsStore.settings);

const hasOrder = computed(() => !!orderData.value?.order || !!orderData.value?.order_number);

const order = computed(() => orderData.value?.order || orderData.value);
const orderItems = computed(() => orderData.value?.items || []);
const orderNum = computed(() => order.value?.order_number || '');
const orderBreakdown = computed(() => getStoredOrderBreakdown(order.value, settings.value));
const orderTotal = computed(() => orderBreakdown.value?.net_amount ?? order.value?.net_amount ?? order.value?.total_amount ?? 0);
const gstStatusLabel = computed(() => getGstStatusLabel(orderBreakdown.value));
const gstNumber = computed(() => orderBreakdown.value?.gst_number || order.value?.gst_number || '');
const customerName = computed(() => order.value?.customer_name || '');
const customerPhone = computed(() => order.value?.phone || '');

const phoneLink = computed(() => getPhoneLink(settings.value.phone));
const whatsappGeneralLink = computed(() =>
  getWhatsAppLink(settings.value.whatsapp, 'Hi! I want to order crackers.') || '#'
);

const whatsappMessage = computed(() =>
  getOrderWhatsAppMessage({
    orderNumber: orderNum.value,
    customerName: customerName.value,
    phone: customerPhone.value,
    totalAmount: orderTotal.value,
  })
);

function handleWhatsAppConfirm() {
  whatsappError.value = '';
  const result = openWhatsApp(settings.value.whatsapp, whatsappMessage.value);
  if (!result.success) {
    whatsappError.value = result.error;
  }
}
</script>

<style lang="scss" scoped>
.success-page {
  padding: 60px 0;
  min-height: 70vh;
  display: flex;
  align-items: center;
}

.success-card {
  @include card;
  max-width: 580px;
  margin: 0 auto;
  padding: 48px 32px;
  text-align: center;

  &--empty {
    p { color: $text-muted; margin-bottom: 24px; }
  }
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}

h1 {
  font-family: $font-display;
  font-size: 2rem;
  color: $primary;
  margin-bottom: 12px;
}

.success-msg { font-size: 1.1rem; margin-bottom: 8px; }
.success-sub { color: $text-muted; margin-bottom: 28px; }

.order-info {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
  flex-wrap: wrap;

  &__item {
    @include card;
    padding: 14px 22px;
    min-width: 140px;

    span { display: block; font-size: 0.8rem; color: $text-muted; margin-bottom: 4px; }
    strong { font-size: 1.1rem; color: $primary; }
  }
}

.order-summary {
  text-align: left;
  background: $background-warm;
  border-radius: $radius-sm;
  padding: 16px 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(125, 60, 94, 0.08);

  h3 {
    font-size: 0.9rem;
    color: $primary;
    margin-bottom: 12px;
    text-align: center;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    font-size: 0.88rem;
    border-bottom: 1px solid rgba(125, 60, 94, 0.06);

    &:last-child { border-bottom: none; }
  }
}

.btn-whatsapp {
  background: #25D366 !important;
  margin-bottom: 12px;
  width: 100%;
  max-width: 320px;

  &:hover { background: #1da851 !important; }
}

.whatsapp-error {
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: #fef2f2;
  border-radius: $radius-sm;
}

.contact-cards {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.contact-card {
  @include card;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  min-width: 180px;

  span { font-size: 1.3rem; }

  div {
    text-align: left;
    small { display: block; color: $text-muted; font-size: 0.75rem; }
    strong { font-size: 0.9rem; }
  }
}

.response-time {
  color: $text-muted;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;

  .btn { width: auto; min-width: 180px; }
}
</style>
