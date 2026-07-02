import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useProductStore = defineStore('product', () => {
  const products = ref([]);
  const loading = ref(false);

  async function fetchProducts(params = {}) {
    loading.value = true;
    try {
      const { data } = await api.get('/products', { params });
      if (Array.isArray(data)) {
        products.value = data;
        return data;
      }
      products.value = data.products || [];
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProduct(slug) {
    const { data } = await api.get(`/products/${slug}`);
    return data;
  }

  async function createProduct(formData) {
    const { data } = await api.post('/products', formData);
    products.value.push(data);
    return data;
  }

  async function updateProduct(id, formData) {
    const { data } = await api.put(`/products/${id}`, formData);
    const idx = products.value.findIndex(p => p.id === id);
    if (idx !== -1) products.value[idx] = data;
    return data;
  }

  async function deleteProduct(id) {
    await api.delete(`/products/${id}`);
    products.value = products.value.filter(p => p.id !== id);
  }

  async function duplicateProduct(id) {
    const { data } = await api.post(`/products/${id}/duplicate`);
    products.value.push(data);
    return data;
  }

  async function reorderProducts(items) {
    await api.put('/products/reorder/bulk', { items });
  }

  return { products, loading, fetchProducts, fetchProduct, createProduct, updateProduct, deleteProduct, duplicateProduct, reorderProducts };
});
