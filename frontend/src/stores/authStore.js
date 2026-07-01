import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || null);
  const user = ref(JSON.parse(localStorage.getItem('admin_user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  async function changePassword(currentPassword, newPassword) {
    const { data } = await api.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me');
    user.value = data.user;
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data.user;
  }

  return { token, user, isAuthenticated, login, logout, changePassword, fetchMe };
});
