<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>
        Orders
        <span v-if="newOrderCount" class="new-badge">{{ newOrderCount }} new</span>
      </h2>
      <button class="btn btn--sm btn--secondary" @click="exportOrders">Export CSV</button>
    </div>

    <div class="filters">
      <input v-model="search" placeholder="Search orders..." @input="debouncedSearch" />
      <select v-model="statusFilter" @change="onFilterChange">
        <option value="">All Status</option>
        <option v-for="s in ORDER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <select v-model="billTypeFilter" @change="onFilterChange">
        <option value="">All Bill Type</option>
        <option value="with_gst">With GST</option>
        <option value="without_gst">Without GST</option>
      </select>
    </div>

    <DateRangeFilter
      v-model:date-preset="datePreset"
      v-model:custom-date-from="customDateFrom"
      v-model:custom-date-to="customDateTo"
      @change="onDateFilterChange"
    />

    <table class="admin-table">
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Phone</th>
          <th>Date</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id" :class="{ 'row-new': order.status === 'new' }">
          <td><strong>{{ order.order_number }}</strong></td>
          <td>{{ order.customer_name }}</td>
          <td>{{ order.phone }}</td>
          <td>{{ formatDate(order.created_at) }}</td>
          <td>{{ formatPrice(order.total_amount) }}</td>
          <td>
            <select
              :value="normalizeStatus(order.status)"
              @change="updateStatus(order.id, $event.target.value)"
              class="status-select"
              :style="{ borderColor: getStatusColor(order.status) }"
            >
              <option v-for="s in ORDER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </td>
          <td class="actions">
            <button @click="$router.push(`/admin/orders/${order.id}`)">View</button>
            <button @click="printOrder(order.id)">Print</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!orders.length && !loading" class="empty-state">No orders found.</div>

    <div v-if="!loading" class="pagination">
      <button :disabled="page <= 1" @click="page--; loadOrders()">Prev</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++; loadOrders()">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { ORDER_STATUSES, LEGACY_STATUS_MAP } from '@/constants';
import { formatPrice, debounce } from '@/utils/helpers';
import { useDateRangeFilter } from '@/composables/useDateRangeFilter';
import DateRangeFilter from '@/components/admin/DateRangeFilter.vue';

const POLL_INTERVAL_MS = 15000;

const router = useRouter();
const orderStore = useOrderStore();
const orders = ref([]);
const search = ref('');
const statusFilter = ref('');
const billTypeFilter = ref('');
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const newOrderCount = ref(0);
const lastPollTime = ref(new Date().toISOString());

let pollTimer = null;

const {
  datePreset,
  customDateFrom,
  customDateTo,
  getDateRangeParams,
} = useDateRangeFilter(() => {
  page.value = 1;
  loadOrders();
});

const debouncedSearch = debounce(() => { page.value = 1; loadOrders(); }, 300);

function normalizeStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

function getStatusColor(status) {
  const normalized = normalizeStatus(status);
  return ORDER_STATUSES.find((s) => s.value === normalized)?.color || '#ccc';
}

function getOrderQueryParams() {
  return {
    page: page.value,
    limit: 10,
    status: statusFilter.value || undefined,
    bill_type: billTypeFilter.value || undefined,
    search: search.value || undefined,
    ...getDateRangeParams(),
  };
}

function onFilterChange() {
  page.value = 1;
  loadOrders();
}

function onDateFilterChange() {
  page.value = 1;
  loadOrders();
}

function exportOrders() {
  const { page: _p, limit: _l, ...exportParams } = getOrderQueryParams();
  orderStore.exportCSV(exportParams);
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function loadOrders() {
  loading.value = true;
  try {
    const data = await orderStore.fetchOrders(getOrderQueryParams());
    orders.value = data.orders;
    totalPages.value = data.totalPages;
    lastPollTime.value = new Date().toISOString();
  } finally {
    loading.value = false;
  }
}

async function pollForNewOrders() {
  if (page.value !== 1 || statusFilter.value || datePreset.value) return;

  try {
    const newOrders = await orderStore.pollNewOrders(lastPollTime.value);
    if (newOrders.length > 0) {
      newOrderCount.value += newOrders.length;
      await loadOrders();
    }
  } catch {
    // silent — polling should not disrupt UI
  }
}

async function updateStatus(id, status) {
  const updated = await orderStore.updateStatus(id, status);
  const order = orders.value.find((o) => o.id === id);
  if (order) {
    Object.assign(order, updated);
  }
  if (order && status !== 'new') {
    newOrderCount.value = Math.max(0, newOrderCount.value - 1);
  }
}

function printOrder(id) {
  const route = router.resolve({
    name: 'admin-order-detail',
    params: { id },
    query: { print: '1' },
  });
  const win = window.open(route.href, '_blank');
  if (!win) {
    alert('Popup blocked. Please allow popups for this site to print orders.');
  }
}

onMounted(() => {
  loadOrders();
  pollTimer = setInterval(pollForNewOrders, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';

.new-badge {
  display: inline-block;
  background: $secondary;
  color: $white;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 10px;
  vertical-align: middle;
  animation: pulse 2s ease-in-out infinite;
}

.row-new {
  background: rgba(37, 99, 235, 0.04);

  td:first-child strong { color: $primary; }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;

  input, select {
    padding: 10px 16px;
    border: 2px solid $border;
    border-radius: $radius-sm;
  }

  input { flex: 1; max-width: 400px; min-width: 180px; }
}

.status-select {
  padding: 4px 8px;
  border: 2px solid $border;
  border-radius: $radius-sm;
  font-size: 0.85rem;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: $text-muted;
}
</style>
