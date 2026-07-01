import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([]);
  const loading = ref(false);

  async function fetchCategories(admin = false) {
    loading.value = true;
    try {
      const { data } = await api.get('/categories', { params: { admin: admin ? 'true' : undefined } });
      categories.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(formData) {
    const { data } = await api.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    categories.value.push(data);
    return data;
  }

  async function updateCategory(id, formData) {
    const { data } = await api.put(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const idx = categories.value.findIndex(c => c.id === id);
    if (idx !== -1) categories.value[idx] = data;
    return data;
  }

  async function deleteCategory(id) {
    const { data } = await api.delete(`/categories/${id}`);
    if (data.hidden) {
      const cat = categories.value.find(c => c.id === id);
      if (cat) cat.is_visible = false;
    } else {
      categories.value = categories.value.filter(c => c.id !== id);
    }
    return data;
  }

  async function reorderCategories(items) {
    await api.put('/categories/reorder/bulk', { items });
    await fetchCategories(true);
  }

  return { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories };
});
