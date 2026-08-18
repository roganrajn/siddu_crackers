import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
    company_name: 'Siddu Crackers',
    phone: '+91 89033 27837',
    whatsapp: '+91 89033 27837',
    email: 'sidducrackers@gmail.com',
    address: 'Sivakasi, Tamil Nadu, India',
    footer_text: '© 2026 Siddu Crackers. All rights reserved.',
    offer_banner: '🔥 80% Discount on All Crackers! Book Your Order Now!',
    confirmation_time: 'Within 2 hours',
    min_order_amount: 5000,
    order_packing_percentage: 5,
    order_gst_percentage: 18,
    primary_color: '#7D3C5E',
    secondary_color: '#F04E8B',
    accent_color: '#00A9B0',
  });
  const loading = ref(false);

  async function fetchSettings() {
    loading.value = true;
    try {
      const { data } = await api.get('/settings');
      if (data && Object.keys(data).length) {
        settings.value = { ...settings.value, ...data };
      }
    } catch {
      // Use defaults if API unavailable
    } finally {
      loading.value = false;
    }
  }

  async function updateSettings(formData) {
    const { data } = await api.put('/settings', formData);
    settings.value = { ...settings.value, ...data };
    return data;
  }

  return { settings, loading, fetchSettings, updateSettings };
});
