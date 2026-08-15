import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

const LAST_ORDER_KEY = 'siddu_last_order';

function loadLastOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastOrder(data) {
  try {
    if (data) sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(LAST_ORDER_KEY);
  } catch { /* non-critical */ }
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref([]);
  const loading = ref(false);
  const lastOrder = ref(loadLastOrder());

  async function submitOrder(orderData) {
    const { data } = await api.post('/orders', orderData);
    lastOrder.value = data;
    saveLastOrder(data);
    return data;
  }

  function clearLastOrder() {
    lastOrder.value = null;
    saveLastOrder(null);
  }

  async function trackOrder(orderNumber, phone) {
    const { data } = await api.post('/orders/track', { order_number: orderNumber, phone });
    return data;
  }

  async function fetchOrders(params = {}) {
    loading.value = true;
    try {
      const { data } = await api.get('/orders', { params });
      orders.value = data.orders;
      return data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Poll for new orders since a timestamp — WebSocket-ready architecture.
   */
  async function pollNewOrders(since) {
    const { data } = await api.get('/orders', {
      params: { since, limit: 50, page: 1 },
    });
    return data.orders;
  }

  async function fetchOrder(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  }

  async function updateStatus(id, status) {
    const { data } = await api.put(`/orders/${id}/status`, { status });
    const idx = orders.value.findIndex((o) => o.id === id);
    if (idx !== -1) orders.value[idx] = data;
    return data;
  }

  async function updateGstApplicable(id, gstApplicable, currentStatus) {
    const { data } = await api.put(`/orders/${id}/status`, {
      status: currentStatus,
      gst_applicable: gstApplicable,
    });
    const idx = orders.value.findIndex((o) => o.id === id);
    if (idx !== -1) orders.value[idx] = data;
    return data;
  }

  async function updatePayment(id, paymentData) {
    const { data } = await api.put(`/orders/${id}/payment`, paymentData);
    const idx = orders.value.findIndex((o) => o.id === id);
    if (idx !== -1) orders.value[idx] = data;
    return data;
  }

  async function exportCSV(params = {}) {
    const response = await api.get('/orders/export/csv', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return {
    orders,
    loading,
    lastOrder,
    submitOrder,
    clearLastOrder,
    trackOrder,
    fetchOrders,
    pollNewOrders,
    fetchOrder,
    updateStatus,
    updateGstApplicable,
    updatePayment,
    exportCSV,
  };
});
