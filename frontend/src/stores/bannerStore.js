import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useBannerStore = defineStore('banner', () => {
  const banners = ref([]);
  const loading = ref(false);

  async function fetchBanners(admin = false) {
    loading.value = true;
    try {
      const { data } = await api.get('/banners', { params: { admin: admin ? 'true' : undefined } });
      banners.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function createBanner(formData) {
    const { data } = await api.post('/banners', formData);
    banners.value.push(data);
    return data;
  }

  async function updateBanner(id, formData) {
    const { data } = await api.put(`/banners/${id}`, formData);
    const idx = banners.value.findIndex(b => b.id === id);
    if (idx !== -1) banners.value[idx] = data;
    return data;
  }

  async function deleteBanner(id) {
    await api.delete(`/banners/${id}`);
    banners.value = banners.value.filter(b => b.id !== id);
  }

  return { banners, loading, fetchBanners, createBanner, updateBanner, deleteBanner };
});
