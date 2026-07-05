<template>
  <section id="categories" class="popular-categories">
    <div class="container">
      <div class="popular-categories__header">
        <h2 class="section-title">Popular Categories</h2>
        <span class="popular-categories__hint">Swipe to explore</span>
      </div>

      <div class="popular-categories__viewport">
        <button
          type="button"
          class="popular-categories__nav popular-categories__nav--prev"
          aria-label="Scroll categories left"
          @click="scrollBy(-1)"
        >
          ‹
        </button>

        <div ref="scrollEl" class="popular-categories__scroll">
          <div class="popular-categories__track">
            <CategoryCard
              v-for="cat in categories"
              :key="cat.id"
              :category="cat"
              variant="compact"
              @select="$emit('select', $event)"
            />
          </div>
        </div>

        <button
          type="button"
          class="popular-categories__nav popular-categories__nav--next"
          aria-label="Scroll categories right"
          @click="scrollBy(1)"
        >
          ›
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import CategoryCard from '@/components/category/CategoryCard.vue';

defineProps({
  categories: { type: Array, default: () => [] },
});

defineEmits(['select']);

const scrollEl = ref(null);

function scrollBy(direction) {
  const el = scrollEl.value;
  if (!el) return;
  el.scrollBy({ left: direction * 280, behavior: 'smooth' });
}
</script>

<style lang="scss" scoped>
.popular-categories {
  padding: 28px 0 20px;
  background: linear-gradient(180deg, rgba(253, 248, 240, 0.45) 0%, transparent 100%);
}

.popular-categories__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  .section-title {
    margin-bottom: 0;
  }
}

.popular-categories__hint {
  font-size: 0.78rem;
  font-weight: 600;
  color: $text-muted;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.popular-categories__viewport {
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 28px;
    z-index: 2;
    pointer-events: none;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, rgba(253, 248, 240, 0.95), transparent);
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, rgba(253, 248, 240, 0.95), transparent);
  }
}

.popular-categories__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  padding: 4px 2px 8px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.popular-categories__track {
  display: grid;
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: column;
  grid-auto-columns: 118px;
  gap: 12px 14px;
  width: max-content;
  scroll-snap-align: start;
}

.popular-categories__nav {
  display: none;
  position: absolute;
  top: 50%;
  z-index: 3;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: $white;
  color: $primary;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(61, 31, 48, 0.15);
  transition: $transition;

  &:hover {
    background: $primary;
    color: $white;
    transform: translateY(-50%) scale(1.05);
  }

  &--prev { left: -6px; }
  &--next { right: -6px; }
}

@media (min-width: 900px) {
  .popular-categories__nav {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popular-categories__viewport {
    padding: 0 12px;
  }
}

@media (max-width: 768px) {
  .popular-categories {
    padding: 24px 0 16px;
  }

  .popular-categories__viewport {
    padding: 0;

    &::before,
    &::after {
      width: 16px;
    }
  }

  .popular-categories__track {
    grid-auto-columns: 104px;
    gap: 10px 12px;
  }

  .popular-categories__hint {
    font-size: 0.72rem;
  }
}
</style>
