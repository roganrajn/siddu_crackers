<template>
  <div v-if="order" class="admin-page order-print-page">
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
        <div class="order-brand-header__invoice-head">
          <span class="order-brand-header__invoice-label">Order Invoice</span>
          <span v-if="gstEnabled" class="order-brand-header__gstin print-only">GSTIN: 33ABAFD1628C1Z6</span>
        </div>
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
        <p><strong>Net Amount:</strong> <span class="total">{{ formatPrice(orderBreakdown?.net_amount ?? order.net_amount ?? order.total_amount) }}</span></p>
        <p class="print-only"><strong>Billing:</strong> {{ gstEnabled ? `With GST (${formatPct(gstRatePct)})` : 'Without GST' }}</p>

        <div class="gst-panel no-print">
          <label class="gst-panel__label">Billing</label>
          <div class="gst-toggle">
            <button
              type="button"
              :class="['gst-toggle__btn', { active: !gstEnabled }]"
              :disabled="savingGst"
              @click="setGst(false)"
            >
              Without GST
            </button>
            <button
              type="button"
              :class="['gst-toggle__btn', { active: gstEnabled }]"
              :disabled="savingGst"
              @click="setGst(true)"
            >
              With GST ({{ formatPct(gstRatePct) }})
            </button>
          </div>
        </div>

        <div v-if="showPaymentPanel" class="payment-panel no-print">
          <button type="button" class="payment-panel__toggle" @click="paymentExpanded = !paymentExpanded">
            <span class="payment-panel__label">Payment</span>
            <span :class="['payment-badge', isPaidStatus ? 'paid' : 'not_received']">
              {{ paymentSummaryLabel }}
            </span>
            <span class="payment-panel__chevron">{{ paymentExpanded ? '▲' : '▼' }}</span>
          </button>

          <div v-if="paymentExpanded" class="payment-panel__body">
            <div v-if="orderBreakdown" class="payment-breakdown">
              <div class="payment-breakdown__row">
                <span>Sub Total</span>
                <span>{{ formatPrice(orderBreakdown.subtotal_mrp) }}</span>
              </div>
              <div class="payment-breakdown__row">
                <span>{{ orderBreakdown.discount_label || 'Discount' }}</span>
                <span class="payment-breakdown__negative">-{{ formatPrice(orderBreakdown.discount_amount) }}</span>
              </div>
              <div class="payment-breakdown__row">
                <span>After Discount</span>
                <span>{{ formatPrice(orderBreakdown.after_discount) }}</span>
              </div>
              <div class="payment-breakdown__row">
                <span>Packing ({{ formatPct(orderBreakdown.packing_percentage) }})</span>
                <span>{{ formatPrice(orderBreakdown.packing_amount) }}</span>
              </div>
              <template v-if="orderBreakdown.gst_enabled">
                <div class="payment-breakdown__row">
                  <span>GST ({{ formatPct(orderBreakdown.gst_rate) }} on After Discount)</span>
                  <span>{{ formatPrice(orderBreakdown.gst_amount) }}</span>
                </div>
              </template>
              <div class="payment-breakdown__row payment-breakdown__row--net">
                <span>{{ orderBreakdown.gst_enabled ? 'Net Amount (incl. GST)' : 'Net Amount' }}</span>
                <strong>{{ formatPrice(orderBreakdown.net_amount) }}</strong>
              </div>
            </div>

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
      <div v-if="orderBreakdown" class="payment-breakdown payment-breakdown--print">
        <div class="payment-breakdown__row payment-breakdown__row--net">
          <span>{{ orderBreakdown.gst_enabled ? 'Net Amount (incl. GST)' : 'Net Amount' }}</span>
          <strong>{{ formatPrice(orderBreakdown.net_amount) }}</strong>
        </div>
        <template v-if="orderBreakdown.gst_enabled">
          <div class="payment-breakdown__row">
            <span>GST ({{ formatPct(orderBreakdown.gst_rate) }} on After Discount)</span>
            <span>{{ formatPrice(orderBreakdown.gst_amount) }}</span>
          </div>
        </template>
      </div>
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
import { useSettingsStore } from '@/stores/settingsStore';
import { ORDER_STATUSES, LEGACY_STATUS_MAP, PAYMENT_METHODS, getPaymentStatusLabel, getPaymentMethodDetail } from '@/constants';
import { formatPrice } from '@/utils/helpers';
import { getStoredOrderBreakdown, applyGstToBreakdown, isOrderGstEnabled, getOrderGstRate } from '@/utils/orderPricing';
import OrderPricingTables from '@/components/order/OrderPricingTables.vue';
import defaultLogo from '@/assets/logo.png';

const route = useRoute();
const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const order = ref(null);
const items = ref([]);
const savingPayment = ref(false);
const paymentError = ref('');
const paymentExpanded = ref(false);
const savingGst = ref(false);
const gstEnabled = ref(false);

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

const gstRatePct = computed(() => {
  if (gstEnabled.value) {
    const stored = parseFloat(order.value?.gst_percentage ?? 0);
    if (!Number.isNaN(stored) && stored > 0) return stored;
  }
  return getOrderGstRate({ gst_enabled: false }, settingsStore.settings);
});

const orderBreakdown = computed(() => {
  if (!order.value) return null;
  const base = getStoredOrderBreakdown(order.value);
  if (!base) return null;
  return applyGstToBreakdown(base, gstEnabled.value, gstRatePct.value);
});

function formatPct(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '0%';
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2).replace(/\.?0+$/, '')}%`;
}

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
  gstEnabled.value = isOrderGstEnabled(data.order);
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
  gstEnabled.value = isOrderGstEnabled(order.value);
  syncPaymentForm();
  paymentExpanded.value = false;
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

async function setGst(enabled) {
  if (!order.value?.id || gstEnabled.value === enabled || savingGst.value) return;
  savingGst.value = true;
  paymentError.value = '';
  const previous = gstEnabled.value;
  gstEnabled.value = enabled;
  try {
    const updated = await orderStore.updateGst(order.value.id, enabled);
    order.value = { ...order.value, ...updated };
    gstEnabled.value = isOrderGstEnabled(order.value);
    if (gstEnabled.value !== enabled) {
      gstEnabled.value = previous;
      paymentError.value = 'GST was not saved on the order. Please retry after the latest deploy.';
    }
  } catch (e) {
    gstEnabled.value = previous;
    paymentError.value = e.response?.data?.error || 'Failed to update GST';
  } finally {
    savingGst.value = false;
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

  &__invoice-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 4px;
    width: 100%;
  }

  &__gstin {
    font-size: 0.75rem;
    font-weight: 700;
    color: $text-dark;
    white-space: nowrap;
    letter-spacing: 0.02em;
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

.gst-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid $border;
}

.gst-panel__label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: $primary;
  margin-bottom: 8px;
}

.gst-toggle {
  display: flex;
  gap: 8px;
}

.gst-toggle__btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid $border;
  border-radius: $radius-sm;
  background: $white;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: $transition;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  &:hover:not(:disabled) {
    border-color: $primary;
  }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.08);
    color: $primary-dark;
  }
}

.payment-breakdown {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid $border;
  border-radius: $radius-sm;
  background: rgba($primary, 0.03);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.payment-breakdown__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;

  span:last-child,
  strong {
    font-weight: 600;
    text-align: right;
  }
}

.payment-breakdown__negative {
  color: #b91c1c;
}

.payment-breakdown__row--net {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid $border;
  font-size: 0.95rem;

  strong {
    color: $primary;
    font-size: 1.05rem;
  }
}

.payment-breakdown--print {
  margin-top: 10px;
  margin-bottom: 0;
  background: transparent;
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
    font-size: 0.9rem;
  }

  .order-brand-header {
    box-shadow: none;
    border: 1px solid #ddd;
    margin-bottom: 16px;
    padding: 12px 16px;
    page-break-inside: avoid;
    page-break-after: avoid;

    &__logo {
      height: 72px;
      max-width: 110px;
    }

    &__name {
      font-size: 1.25rem;
    }

    &__contact {
      font-size: 0.82rem;
    }

    &__invoice {
      border-left-color: #ccc;
      min-width: 220px;

      &-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        width: 100%;
        gap: 20px;
      }
    }

    &__gstin {
      font-size: 0.8rem;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }

  .order-detail-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .detail-card {
    box-shadow: none;
    border: 1px solid #ddd;
    padding: 14px 16px;
    break-inside: avoid;
    page-break-inside: avoid;

    h3 {
      margin-bottom: 10px;
      font-size: 0.95rem;
    }

    p {
      margin-bottom: 4px;
      font-size: 0.82rem;
    }
  }

  .payment-card {
    margin-top: 12px;
    page-break-inside: avoid;
  }

  .items-card {
    box-shadow: none;
    border: 1px solid #ddd;
    padding: 14px 16px;
    margin-top: 12px;
    page-break-inside: auto;

    h3 {
      margin-bottom: 10px;
      font-size: 0.95rem;
    }
  }

  :deep(.order-pricing) {
    gap: 12px;
  }

  :deep(.order-pricing__items) {
    th, td {
      padding: 5px 8px;
      font-size: 0.78rem;
    }

    thead {
      display: table-header-group;
    }

    tbody tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }

  :deep(.pricing-summary--table) {
    width: min(100%, 320px);
    page-break-inside: avoid;
    break-inside: avoid;

    .pricing-summary__row {
      padding: 6px 10px;
      font-size: 0.78rem;
    }

    .pricing-summary__row--net {
      padding: 8px 10px;
      font-size: 0.85rem;
      background: #fff !important;
      color: #1a1a1a !important;
      border-top: 2px solid #1a1a1a !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;

      span,
      strong {
        color: #1a1a1a !important;
        font-weight: 700 !important;
      }

      strong {
        font-size: 0.95rem !important;
      }
    }
  }

  .detail-card .total {
    color: #1a1a1a !important;
    font-weight: 800 !important;
  }
}
</style>
