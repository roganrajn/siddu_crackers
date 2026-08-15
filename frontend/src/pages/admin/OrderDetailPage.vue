<template>
  <div v-if="order" class="admin-page order-print-page" :class="{ 'order-print-page--compact': isCompactPrint }">
    <div class="page-header no-print">
      <h2>Order #{{ order.order_number }}</h2>
      <div class="page-header__actions">
        <button type="button" class="btn btn--sm" @click="handlePrint">🖨 Print</button>
        <button type="button" class="btn btn--sm btn--outline" @click="$router.back()">← Back</button>
      </div>
    </div>

    <div class="order-brand-header">
      <div class="order-brand-header__logo-wrap">
        <img :src="logoSrc" :alt="companyName" class="order-brand-header__logo" />
      </div>

      <div class="order-brand-header__main">
        <h1 class="order-brand-header__name">{{ companyName }}</h1>
        <div v-if="companyPhone || companyEmail" class="order-brand-header__contact">
          <span v-if="companyPhone" class="order-brand-header__contact-item">📞 {{ companyPhone }}</span>
          <span v-if="companyPhone && companyEmail" class="order-brand-header__divider">|</span>
          <span v-if="companyEmail" class="order-brand-header__contact-item">✉️ {{ companyEmail }}</span>
        </div>
      </div>

      <div class="order-brand-header__invoice">
        <span class="order-brand-header__invoice-label">Order Invoice</span>
        <strong class="order-brand-header__invoice-no">#{{ order.order_number }}</strong>
      </div>
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

      <div class="detail-card detail-card--info">
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
        <p><strong>Net Amount:</strong> <span class="total">{{ formatPrice(displayNetAmount) }}</span></p>
        <p v-if="orderBreakdown?.gst_applicable">
          <strong>GST ({{ orderBreakdown.gst_percentage }}%):</strong> {{ formatPrice(orderBreakdown.gst_amount) }}
        </p>
        <p v-else-if="orderBreakdown">
          <strong>GST:</strong> Not Applicable
        </p>
        <p v-if="orderBreakdown?.gst_applicable && (order.gst_number || orderBreakdown?.gst_number)">
          <strong>GSTIN:</strong> {{ order.gst_number || orderBreakdown?.gst_number }}
        </p>
        <p class="status-row">
          <strong>GST:</strong>
          <span class="status-print">{{ gstPrintLabel }}</span>
          <select
            :value="String(order.gst_applicable === true)"
            class="status-select no-print"
            :disabled="savingGst"
            @change="updateGstApplicable($event.target.value === 'true')"
          >
            <option value="false">Without GST</option>
            <option value="true">With GST</option>
          </select>
        </p>
        <p v-if="gstError" class="bill-type-error no-print">{{ gstError }}</p>

        <div v-if="showPaymentPanel" class="payment-panel no-print">
          <button type="button" class="payment-panel__toggle" @click="paymentExpanded = !paymentExpanded">
            <span class="payment-panel__label">Payment</span>
            <span :class="['payment-badge', isPaidStatus ? 'paid' : 'not_received']">
              {{ paymentSummaryLabel }}
            </span>
            <span class="payment-panel__chevron">{{ paymentExpanded ? '▲' : '▼' }}</span>
          </button>

          <div v-if="paymentExpanded" class="payment-panel__body">
            <div class="payment-form payment-form--compact">
              <div class="form-group">
                <label>Method</label>
                <select v-model="paymentForm.payment_method">
                  <option
                    v-for="m in (isPaidStatus ? PAYMENT_METHODS : PAYMENT_ENTRY_METHODS)"
                    :key="m.value"
                    :value="m.value"
                  >
                    {{ m.label }}
                  </option>
                </select>
              </div>

              <template v-if="needsTransactionDetails">
                <div class="form-group">
                  <label>Transaction ID</label>
                  <input
                    v-model="paymentForm.payment_transaction_id"
                    placeholder="UPI / bank transaction ID"
                  />
                </div>
                <div class="form-group">
                  <label>Remarks</label>
                  <input v-model="paymentForm.payment_remarks" placeholder="Optional" />
                </div>
              </template>

              <p v-if="paymentForm.payment_method === 'not_received'" class="payment-hint">
                Saves as not received and sets status to Confirmed.
              </p>
              <p v-else-if="needsTransactionDetails && !paymentForm.payment_transaction_id?.trim()" class="payment-hint">
                Transaction ID required to mark as Paid.
              </p>

              <div class="payment-actions">
                <button type="button" class="btn btn--sm" :disabled="savingPayment" @click="savePayment">
                  {{ savingPayment ? 'Saving...' : 'Save Payment' }}
                </button>
                <button
                  v-if="isPaidStatus"
                  type="button"
                  class="btn btn--sm btn--outline"
                  @click="cancelPaymentEdit"
                >
                  Cancel
                </button>
              </div>
              <p v-if="paymentError" class="payment-error">{{ paymentError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isPaidStatus" class="detail-card payment-card print-only">
      <h3>Payment</h3>
      <p><strong>Status:</strong> {{ paymentStatusLabel }}<span v-if="paymentMethodDetail"> · {{ paymentMethodDetail }}</span></p>
      <p v-if="order.payment_transaction_id"><strong>Transaction ID:</strong> {{ order.payment_transaction_id }}</p>
      <p v-if="order.payment_remarks"><strong>Remarks:</strong> {{ order.payment_remarks }}</p>
    </div>

    <div
      class="detail-card items-card"
      :class="{ 'items-card--compact': isCompactPrint }"
    >
      <h3>Order Items</h3>
      <OrderPricingTables
        :items="items"
        :breakdown="orderBreakdown"
        :fallback-total="order.total_amount"
        :compact="isCompactPrint"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ORDER_STATUSES, LEGACY_STATUS_MAP, PAYMENT_METHODS, getPaymentStatusLabel, getPaymentMethodDetail } from '@/constants';
import { formatPrice } from '@/utils/helpers';
import { getStoredOrderBreakdown } from '@/utils/orderPricing';
import OrderPricingTables from '@/components/order/OrderPricingTables.vue';
import defaultLogo from '@/assets/logo.png';

const route = useRoute();
const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const order = ref(null);
const items = ref([]);
const savingPayment = ref(false);
const savingGst = ref(false);
const paymentError = ref('');
const gstError = ref('');
const paymentExpanded = ref(false);

const PAYMENT_ENTRY_METHODS = PAYMENT_METHODS.filter((m) => m.value !== 'not_received');

const paymentForm = ref({
  payment_method: 'not_received',
  payment_transaction_id: '',
  payment_remarks: '',
});

const displayStatus = computed(() =>
  order.value ? (LEGACY_STATUS_MAP[order.value.status] || order.value.status) : 'new'
);

const isConfirmed = computed(() => displayStatus.value === 'confirmed');
const isPaidStatus = computed(() => displayStatus.value === 'paid');
const showPaymentPanel = computed(() => isConfirmed.value || isPaidStatus.value);

const paymentSummaryLabel = computed(() => {
  if (isPaidStatus.value) {
    return paymentMethodDetail.value
      ? `Paid · ${paymentMethodDetail.value}`
      : paymentStatusLabel.value;
  }
  return paymentStatusLabel.value;
});

const needsTransactionDetails = computed(() =>
  ['upi', 'bank_transfer'].includes(paymentForm.value.payment_method)
);

const paymentStatusLabel = computed(() => getPaymentStatusLabel(order.value));
const paymentMethodDetail = computed(() => getPaymentMethodDetail(order.value));

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

const gstPrintLabel = computed(() => {
  if (!orderBreakdown.value?.gst_applicable) return 'Without GST';
  return `With GST (${orderBreakdown.value.gst_percentage}%)`;
});

const orderBreakdown = computed(() => (order.value ? getStoredOrderBreakdown(order.value, settingsStore.settings) : null));

const displayNetAmount = computed(() =>
  orderBreakdown.value?.net_amount ?? order.value?.net_amount ?? order.value?.total_amount ?? 0
);

const isCompactPrint = computed(() => items.value.length <= 6);

const companyName = computed(() =>
  (settingsStore.settings.company_name || 'Siddu Crackers').toUpperCase()
);
const companyPhone = computed(() => settingsStore.settings.phone || settingsStore.settings.whatsapp || '');
const companyEmail = computed(() => settingsStore.settings.email || '');
const logoSrc = computed(() => settingsStore.settings.logo || defaultLogo);

onMounted(async () => {
  await settingsStore.fetchSettings();
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
  const method = order.value.payment_method || 'not_received';
  paymentForm.value = {
    payment_method: method === 'not_received' ? 'upi' : method,
    payment_transaction_id: order.value.payment_transaction_id || '',
    payment_remarks: order.value.payment_remarks || '',
  };
}

function cancelPaymentEdit() {
  syncPaymentForm();
  paymentError.value = '';
  paymentExpanded.value = false;
}

function handlePrint() {
  window.print();
}

async function updateStatus(status) {
  paymentError.value = '';
  const updated = await orderStore.updateStatus(order.value.id, status);
  order.value = { ...order.value, ...updated };
  syncPaymentForm();
  paymentExpanded.value = false;
}

async function updateGstApplicable(gstApplicable) {
  gstError.value = '';
  savingGst.value = true;
  try {
    const updated = await orderStore.updateGstApplicable(
      order.value.id,
      gstApplicable,
      displayStatus.value
    );
    order.value = { ...order.value, ...updated };
    const fresh = await orderStore.fetchOrder(order.value.id);
    order.value = fresh.order;
    items.value = fresh.items;
  } catch (e) {
    gstError.value = e.response?.data?.error || 'Failed to update GST';
  } finally {
    savingGst.value = false;
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
    paymentExpanded.value = false;
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

.order-brand-header {
  @include card;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  margin-bottom: 20px;

  &__logo-wrap {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-width: 110px;
  }

  &__logo {
    display: block;
    height: 96px;
    width: auto;
    max-width: 140px;
    object-fit: contain;
    object-position: left center;
  }

  &__main {
    min-width: 0;
    flex: 1;
  }

  &__name {
    margin: 0 0 8px;
    font-size: 1.75rem;
    font-weight: 800;
    color: $primary-dark;
    line-height: 1.15;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__contact {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    font-size: 0.92rem;
    font-weight: 600;
    color: $text-dark;
  }

  &__contact-item {
    white-space: nowrap;
  }

  &__divider {
    color: $text-muted;
    font-weight: 400;
  }

  &__invoice {
    flex-shrink: 0;
    text-align: right;
    padding-left: 16px;
    border-left: 1px solid $border;
  }

  &__invoice-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $text-muted;
    margin-bottom: 4px;
  }

  &__invoice-no {
    font-size: 1.1rem;
    color: $primary-dark;
  }
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

.detail-card--info {
  display: flex;
  flex-direction: column;
}

.payment-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $border;
}

.payment-panel__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid $border;
  border-radius: $radius-sm;
  background: $background;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: $transition;

  &:hover {
    border-color: $primary;
    background: rgba($primary, 0.04);
  }
}

.payment-panel__label {
  font-size: 0.85rem;
  font-weight: 700;
  color: $primary;
}

.payment-panel__chevron {
  margin-left: auto;
  font-size: 0.7rem;
  color: $text-muted;
}

.payment-panel__body {
  margin-top: 12px;
}

.payment-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;

  &.not_received { background: #fef3c7; color: #d97706; }
  &.paid { background: #d1fae5; color: #059669; }
}

.payment-form--compact {
  gap: 10px;
  max-width: none;
}

.payment-form--compact .form-group input,
.payment-form--compact .form-group select {
  padding: 8px 10px;
  font-size: 0.88rem;
}

.payment-card {
  margin-top: 20px;
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

.bill-type-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 4px 0 0;
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

  .order-brand-header {
    flex-wrap: wrap;

    &__invoice {
      width: 100%;
      border-left: none;
      border-top: 1px solid $border;
      padding: 12px 0 0;
      text-align: left;
    }

    &__logo {
      height: 80px;
      max-width: 120px;
    }
  }
}

@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

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
    min-height: auto !important;
    height: auto !important;
  }

  .order-brand-header {
    box-shadow: none;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    padding: 8px 12px;
    page-break-inside: avoid;

    &__logo {
      height: 52px;
      max-width: 90px;
    }

    &__name {
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    &__contact {
      font-size: 0.75rem;
    }

    &__invoice {
      border-left-color: #ccc;
    }

    &__invoice-label {
      font-size: 0.68rem;
      margin-bottom: 2px;
    }

    &__invoice-no {
      font-size: 0.95rem;
    }
  }

  .order-detail-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
    page-break-inside: avoid;
  }

  .detail-card {
    box-shadow: none;
    border: 1px solid #ddd;
    break-inside: avoid;
    padding: 10px 12px;

    h3 {
      margin-bottom: 6px;
      font-size: 0.85rem;
    }

    p {
      margin-bottom: 3px;
      font-size: 0.75rem;
      line-height: 1.35;
    }

    .total {
      font-size: 1rem !important;
    }
  }

  .items-card {
    box-shadow: none;
    border: 1px solid #ddd;
    margin-top: 0;
    page-break-inside: auto;
    break-inside: auto;

    h3 {
      margin-bottom: 4px;
    }
  }

  .items-card--compact {
    margin-top: 6px;
    padding: 8px 10px;
  }

  .order-print-page--compact {
    .order-brand-header {
      margin-bottom: 8px;
      padding: 6px 10px;
    }

    .order-detail-grid {
      gap: 6px;
      margin-bottom: 6px;
    }

    .detail-card {
      padding: 8px 10px;
    }
  }

  .payment-card {
    margin-top: 8px;
    padding: 8px 10px;
  }

  .admin-table {
    box-shadow: none;
    border: 1px solid #ddd;

    th, td {
      padding: 4px 6px;
      font-size: 0.75rem;
    }

    tbody tr {
      break-inside: avoid;
    }
  }
}
</style>
