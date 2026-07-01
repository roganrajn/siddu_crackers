import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useReviewStore = defineStore('review', () => {
  const reviews = ref([]);

  async function fetchReviews(admin = false) {
    const { data } = await api.get('/reviews', { params: { admin: admin ? 'true' : undefined } });
    reviews.value = data;
    return data;
  }

  return { reviews, fetchReviews };
});
