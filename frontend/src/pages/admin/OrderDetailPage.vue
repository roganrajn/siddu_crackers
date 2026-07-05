<template>
  <div v-if="order" class="admin-page order-print-page">
    <div class="page-header no-print">
      <h2>Order #{{ order.order_number }}</h2>
      <div class="page-header__actions">
        <button type="button" class="btn btn--sm" @click="handlePrint">🖨 Print</button>
        <button type="button" class="btn btn--sm btn--outline" @click="$router.back()">← Back</button>
      </div>
    </div>

    <div class="print-header print-only">
      <h1>Siddu Crackers</h1>
      <p>Order Invoice · #{{ order.order_number }}</p>
    </div>

    <div class="order-detail-grid">
      <div class="detail-card">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> {{ order.customer_name }}</p>
        <p><strong>Phone:</strong> {{ order.phone }}</p>
        <p v-if="order.whatsapp"><strong>WhatsApp:</strong> {{ order.whatsapp }}</p>
        <p v-if="order.email"><strong>Email:</strong> {{ order.email }}</p>
        <p><strong>Address:</strong> {{ order.address }}, {{ order.city }}, {{ order.state }} - {{ order.pincode }}</p>
        <p v-if="order.remarks"><strong>Remarks:</strong> {{ order.remarks }}</p>
      </div>

      <div class="detail-card">
        <h3>Order Info</h3>
        <p><strong>Date:</strong> {{ formattedDate }}</p>
        <p class="status-row">
          <strong>Status:</strong>
          <span class="status-print">{{ statusLabel }}</span>
          <select
            :value="displayStatus"
            class="status-select no-print"
            @change="updateStatus($event.target.value)"
          >
            <option v-for="s in ORDER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </p>
        <p><strong>Net Amount:</strong> <span class="total">{{ formatPrice(order.net_amount || order.total_amount) }}</span></p>
      </div>
    </div>

    <div v-if="isConfirmed" class="detail-card payment-card no-print">
      <h3>Payment</h3>
      <p class="payment-status">
        <strong>Current:</strong>
        <span :class="['payment-badge', effectivePaymentMethod]">{{ paymentStatusLabel }}</span>
      </p>

      <div class="payment-form">
        <div class="form-group">
          <label>Payment Method</label>
          <select v-model="paymentForm.payment_method">
            <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>

        <template v-if="needsTransactionDetails">
          <div class="form-group">
            <label>Transaction ID</label>
            <input
              v-model="paymentForm.payment_transaction_id"
              placeholder="Enter UPI / bank transaction ID"
            />
          </div>
          <div class="form-group">
            <label>Remarks</label>
            <input
              v-model="paymentForm.payment_remarks"
              placeholder="Payment notes (optional)"
            />
          </div>
          <p v-if="!paymentForm.payment_transaction_id?.trim()" class="payment-hint">
            Without a Transaction ID, payment will be saved as "Payment not received yet".
          </p>
        </template>

        <div class="payment-actions">
          <button type="button" class="btn btn--sm" :disabled="savingPayment" @click="savePayment">
            {{ savingPayment ? 'Saving...' : 'Save Payment' }}
          </button>
        </div>
        <p v-if="paymentError" class="payment-error">{{ paymentError }}</p>
      </div>
    </div>

    <div v-if="isConfirmed" class="detail-card payment-card print-only">
      <h3>Payment</h3>
      <p><strong>Status:</strong> {{ paymentStatusLabel }}</p>
      <p v-if="order.payment_transaction_id"><strong>Transaction ID:</strong> {{ order.payment_transaction_id }}</p>
      <p v-if="order.payment_remarks"><strong>Remarks:</strong> {{ order.payment_remarks }}</p>
    </div>

    <div class="detail-card items-card">
      <h3>Order Items</h3>
      <OrderPricingTables
        :items="items"
        :breakdown="orderBreakdown"
        :fallback-total="order.total_amount"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { ORDER_STATUSES, LEGACY_STATUS_MAP, PAYMENT_METHODS, getEffectivePaymentMethod, getPaymentMethodLabel } from '@/constants';
import { formatPrice } from '@/utils/helpers';
import { getStoredOrderBreakdown } from '@/utils/orderPricing';
import OrderPricingTables from '@/components/order/OrderPricingTables.vue';

const route = useRoute();
const orderStore = useOrderStore();
const order = ref(null);
const items = ref([]);
const savingPayment = ref(false);
const paymentError = ref('');

const paymentForm = ref({
  payment_method: 'not_received',
  payment_transaction_id: '',
  payment_remarks: '',
});

const displayStatus = computed(() =>
  order.value ? (LEGACY_STATUS_MAP[order.value.status] || order.value.status) : 'new'
);

const isConfirmed = computed(() => displayStatus.value === 'confirmed');

const needsTransactionDetails = computed(() =>
  ['upi', 'bank_transfer'].includes(paymentForm.value.payment_method)
);

const effectivePaymentMethod = computed(() => getEffectivePaymentMethod(order.value));

const paymentStatusLabel = computed(() => getPaymentMethodLabel(order.value));

const statusLabel = computed(() =>
  ORDER_STATUSES.find((s) => s.value === displayStatus.value)?.label || displayStatus.value
);

const formattedDate = computed(() =>
  order.value
    ? new Date(order.value.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : ''
);

const orderBreakdown = computed(() => (order.value ? getStoredOrderBreakdown(order.value) : null));

onMounted(async () => {
  const data = await orderStore.fetchOrder(route.params.id);
  order.value = data.order;
  items.value = data.items;
  syncPaymentForm();

  if (route.query.print) {
    await nextTick();
    setTimeout(handlePrint, 600);
  }
});

function syncPaymentForm() {
  if (!order.value) return;
  paymentForm.value = {
    payment_method: order.value.payment_method || 'not_received',
    payment_transaction_id: order.value.payment_transaction_id || '',
    payment_remarks: order.value.payment_remarks || '',
  };
}

function handlePrint() {
  window.print();
}

async function updateStatus(status) {
  paymentError.value = '';
  const updated = await orderStore.updateStatus(order.value.id, status);
  order.value = { ...order.value, ...updated };
  if ((LEGACY_STATUS_MAP[updated.status] || updated.status) === 'confirmed') {
    syncPaymentForm();
  }
}

async function savePayment() {
  savingPayment.value = true;
  paymentError.value = '';
  try {
    const updated = await orderStore.updatePayment(order.value.id, {
      payment_method: paymentForm.value.payment_method,
      payment_transaction_id: paymentForm.value.payment_transaction_id,
      payment_remarks: paymentForm.value.payment_remarks,
    });
    order.value = { ...order.value, ...updated };
    syncPaymentForm();
  } catch (e) {
    paymentError.value = e.response?.data?.error || 'Failed to save payment';
  } finally {
    savingPayment.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';

.print-only {
  display: none;
}

.order-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detail-card {
  @include card;
  padding: 24px;

  h3 { margin-bottom: 16px; color: $primary; }
  p { margin-bottom: 8px; font-size: 0.9rem; }
  .total { font-size: 1.3rem; font-weight: 700; color: $primary; }
}

.items-card {
  margin-top: 20px;
}

.payment-card {
  margin-top: 20px;
}

.payment-status {
  margin-bottom: 16px;
}

.payment-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 8px;

  &.not_received { background: #fef3c7; color: #d97706; }
  &.upi, &.bank_transfer { background: #d1fae5; color: #059669; }
  &.cash { background: #dbeafe; color: #2563eb; }
}

.payment-form {
  display: grid;
  gap: 14px;
  max-width: 480px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: $text-dark;
  }

  input, select {
    padding: 10px 12px;
    border: 2px solid $border;
    border-radius: $radius-sm;
    font: inherit;
  }
}

.payment-hint {
  font-size: 0.82rem;
  color: $text-muted;
  margin: 0;
}

.payment-actions {
  margin-top: 4px;
}

.payment-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 0;
}

.status-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.status-print {
  display: none;
  font-weight: 600;
  color: $primary;
}

.status-select {
  padding: 4px 8px;
  border: 1px solid $border;
  border-radius: $radius-sm;
}

.items-table tfoot td {
  border-top: 2px solid $border;
  padding-top: 12px;
}

.page-header__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .order-detail-grid { grid-template-columns: 1fr; }
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .status-print {
    display: inline !important;
  }

  .order-print-page {
    padding: 0;
  }

  .print-header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #333;

    h1 {
      font-size: 1.5rem;
      margin-bottom: 4px;
    }

    p {
      font-size: 0.95rem;
      color: #555;
    }
  }

  .order-detail-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    page-break-inside: avoid;
  }

  .detail-card {
    box-shadow: none;
    border: 1px solid #ddd;
    break-inside: avoid;
  }

  .items-card {
    box-shadow: none;
    border: 1px solid #ddd;
    page-break-inside: auto;
  }

  .admin-table {
    box-shadow: none;
    border: 1px solid #ddd;

    th, td {
      padding: 8px 12px;
      font-size: 0.85rem;
    }

    tbody tr {
      break-inside: avoid;
    }
  }
}
</style>
