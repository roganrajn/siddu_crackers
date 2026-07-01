<template>
  <section class="reviews-section">
    <div class="container">
      <h2 class="section-title">What Our Customers Say</h2>
      <div class="reviews-grid">
        <div v-for="review in reviews" :key="review.id" class="review-card">
          <div class="review-card__quote" aria-hidden="true">"</div>
          <div class="review-card__stars">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</div>
          <p class="review-card__comment">{{ review.comment }}</p>
          <strong class="review-card__name">{{ review.customer_name }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useReviewStore } from '@/stores/reviewStore';

const reviewStore = useReviewStore();
const reviews = computed(() => reviewStore.reviews);

onMounted(() => reviewStore.fetchReviews());
</script>

<style lang="scss" scoped>
.reviews-section {
  padding: 56px 0;
  background: $white;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 22px;
}

.review-card {
  @include card;
  padding: 28px 24px;
  position: relative;
  border-left: 4px solid $gold;
  transition: $transition;

  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-hover;
  }

  &__quote {
    position: absolute;
    top: 12px;
    right: 20px;
    font-family: $font-display;
    font-size: 3rem;
    color: rgba(125, 60, 94, 0.1);
    line-height: 1;
  }

  &__stars {
    margin-bottom: 14px;
    font-size: 1rem;
    color: $gold;
    letter-spacing: 2px;
  }

  &__comment {
    color: $text-muted;
    line-height: 1.7;
    margin-bottom: 18px;
    font-size: 0.95rem;
    position: relative;
    z-index: 1;
  }

  &__name {
    color: $primary;
    font-size: 0.9rem;
    font-weight: 700;
  }
}
</style>
