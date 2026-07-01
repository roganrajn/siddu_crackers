<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card stat-card--primary">
        <span class="stat-icon">📦</span>
        <div><strong>{{ stats.ordersToday }}</strong><span>Orders Today</span></div>
      </div>
      <div class="stat-card stat-card--warning">
        <span class="stat-icon">⏳</span>
        <div><strong>{{ stats.pendingOrders }}</strong><span>Pending Orders</span></div>
      </div>
      <div class="stat-card stat-card--success">
        <span class="stat-icon">✅</span>
        <div><strong>{{ stats.completedOrders }}</strong><span>Completed</span></div>
      </div>
      <div class="stat-card stat-card--revenue">
        <span class="stat-icon">💰</span>
        <div><strong>{{ formatPrice(stats.totalRevenue) }}</strong><span>Total Revenue</span></div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🎇</span>
        <div><strong>{{ stats.totalProducts }}</strong><span>Products</span></div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📁</span>
        <div><strong>{{ stats.totalCategories }}</strong><span>Categories</span></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <h3>Orders (Last 7 Days)</h3>
        <div class="bar-chart">
          <div v-for="day in chartData" :key="day.date" class="bar-col">
            <div class="bar" :style="{ height: barHeight(day.orders) + '%' }">
              <span class="bar-value">{{ day.orders }}</span>
            </div>
            <span class="bar-label">{{ formatDay(day.date) }}</span>
          </div>
          <div v-if="!chartData.length" class="chart-empty">No data yet</div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Order Status</h3>
        <div class="status-list">
          <div v-for="s in stats.statusBreakdown" :key="s.status" class="status-row">
            <span class="status-name">{{ formatStatus(s.status) }}</span>
            <div class="status-bar-wrap">
              <div class="status-bar" :style="{ width: statusPercent(s.count) + '%' }"></div>
            </div>
            <span class="status-count">{{ s.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="recent-orders">
      <h2>Recent Orders</h2>
      <table class="admin-table">
        <thead>
          <tr><th>Order #</th><th>Customer</th><th>Phone</th><th>Total</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          <tr v-for="order in stats.recentOrders" :key="order.id" @click="$router.push(`/admin/orders/${order.id}`)">
            <td>{{ order.order_number }}</td>
            <td>{{ order.customer_name }}</td>
            <td>{{ order.phone }}</td>
            <td>{{ formatPrice(order.total_amount) }}</td>
            <td><span :class="['status-badge', order.status]">{{ formatStatus(order.status) }}</span></td>
            <td>{{ new Date(order.created_at).toLocaleDateString('en-IN') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { formatPrice } from '@/utils/helpers';
import { ORDER_STATUSES } from '@/constants';

const stats = ref({
  ordersToday: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0,
  totalProducts: 0, totalCategories: 0, recentOrders: [], statusBreakdown: [],
});
const chartData = ref([]);
const maxOrders = ref(1);

onMounted(async () => {
  const { data } = await api.get('/dashboard/stats');
  stats.value = data;
  chartData.value = data.chartData || [];
  maxOrders.value = Math.max(...chartData.value.map(d => parseInt(d.orders)), 1);
});

function barHeight(orders) {
  return Math.max((parseInt(orders) / maxOrders.value) * 100, 4);
}

function formatDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });
}

function formatStatus(status) {
  return ORDER_STATUSES.find(s => s.value === status)?.label || status;
}

function statusPercent(count) {
  const total = stats.value.statusBreakdown.reduce((s, r) => s + parseInt(r.count), 0);
  return total ? (parseInt(count) / total) * 100 : 0;
}
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  @include card;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-left: 4px solid $border;

  &--primary { border-left-color: $primary; }
  &--warning { border-left-color: #f59e0b; }
  &--success { border-left-color: #22c55e; }
  &--revenue { border-left-color: $accent; }

  .stat-icon { font-size: 1.8rem; }
  strong { display: block; font-size: 1.4rem; color: $text-dark; }
  span { color: $text-muted; font-size: 0.8rem; }
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  @include card;
  padding: 24px;
  h3 { margin-bottom: 20px; font-size: 1rem; }
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding-top: 20px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, $primary, $secondary);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: height 0.5s ease;
  .bar-value {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    font-weight: 600;
  }
}

.bar-label { font-size: 0.65rem; color: $text-muted; margin-top: 6px; }
.chart-empty { color: $text-muted; width: 100%; text-align: center; }

.status-list { display: flex; flex-direction: column; gap: 10px; }

.status-row {
  display: grid;
  grid-template-columns: 120px 1fr 30px;
  align-items: center;
  gap: 10px;
  .status-name { font-size: 0.8rem; }
  .status-count { font-size: 0.8rem; font-weight: 600; text-align: right; }
}

.status-bar-wrap {
  height: 8px;
  background: $background;
  border-radius: 4px;
  overflow: hidden;
}

.status-bar {
  height: 100%;
  background: $primary;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.recent-orders {
  @include card;
  padding: 24px;
  h2 { margin-bottom: 16px; }
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid $border; font-size: 0.85rem; }
  th { background: $background; }
  tbody tr { cursor: pointer; &:hover { background: $background; } }
}

.status-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  &.new { background: #dbeafe; color: #2563eb; }
  &.contacted, &.called_customer, &.waiting_confirmation { background: #fef3c7; color: #d97706; }
  &.confirmed, &.packed { background: #d1fae5; color: #059669; }
  &.completed { background: #e5e7eb; color: #374151; }
  &.cancelled { background: #fee2e2; color: #dc2626; }
}

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
}
</style>
