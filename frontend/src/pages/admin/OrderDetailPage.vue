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
        <p><strong>Total:</strong> <span class="total">{{ formatPrice(order.total_amount) }}</span></p>
      </div>
    </div>

    <div class="detail-card items-card">
      <h3>Order Items</h3>
      <table class="admin-table items-table">
        <thead>
          <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.product_name }}</td>
            <td>{{ formatPrice(item.price) }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ formatPrice(item.subtotal) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Grand Total</strong></td>
            <td><strong>{{ formatPrice(order.total_amount) }}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { ORDER_STATUSES, LEGACY_STATUS_MAP } from '@/constants';
import { formatPrice } from '@/utils/helpers';

const route = useRoute();
const orderStore = useOrderStore();
const order = ref(null);
const items = ref([]);

const displayStatus = computed(() =>
  order.value ? (LEGACY_STATUS_MAP[order.value.status] || order.value.status) : 'new'
);

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

onMounted(async () => {
  const data = await orderStore.fetchOrder(route.params.id);
  order.value = data.order;
  items.value = data.items;

  if (route.query.print) {
    await nextTick();
    setTimeout(handlePrint, 600);
  }
});

function handlePrint() {
  window.print();
}

async function updateStatus(status) {
  await orderStore.updateStatus(order.value.id, status);
  order.value.status = status;
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
