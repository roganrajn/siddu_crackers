<template>
  <div class="sticky-bar" :class="{ visible: isVisible }">
    <div class="sticky-bar__scroll">
      <div class="sticky-bar__inner">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="sticky-bar__item"
          :class="{ active: activeSlug === cat.slug }"
          :title="cat.name"
          @click="$emit('select', cat)"
        >
          <span
            class="sticky-bar__thumb"
            :style="getCategoryVisualStyle(cat)"
          >
            <span v-if="!cat.banner_image" class="sticky-bar__icon">{{ cat.icon || '🎇' }}</span>
          </span>
          <span class="sticky-bar__label">{{ cat.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCategoryVisualStyle } from '@/utils/categoryVisual.js';

defineProps({
  categories: { type: Array, default: () => [] },
  activeSlug: { type: String, default: '' },
  isVisible: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>

<style lang="scss" scoped>
.sticky-bar {
  position: fixed;
  top: var(--site-header-height, #{$top-bar-total});
  left: 0;
  right: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(125, 60, 94, 0.12);
  box-shadow: 0 4px 20px rgba(61, 31, 48, 0.08);
  transform: translateY(-110%);
  transition: transform 0.3s ease;
  pointer-events: none;

  &.visible {
    transform: translateY(0);
    pointer-events: auto;
  }

  &__scroll {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__inner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    min-height: 52px;
    width: max-content;
    min-width: 100%;
  }

  &__item {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px 8px 8px;
    border: 2px solid $border;
    border-radius: 999px;
    background: $white;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.2;
    color: $text-dark;
    cursor: pointer;
    transition: $transition;
    max-width: 220px;

    &:hover,
    &.active {
      border-color: $primary;
      background: $primary;
      color: $white;

      .sticky-bar__thumb {
        border-color: rgba(255, 255, 255, 0.45);
      }
    }
  }

  &__thumb {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-repeat: no-repeat;
    overflow: hidden;
    border: 1px solid rgba(125, 60, 94, 0.12);
  }

  &__icon {
    font-size: 1rem;
    line-height: 1;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .sticky-bar {
    &__inner {
      padding: 10px 12px;
      gap: 6px;
      min-height: 48px;
    }

    &__item {
      padding: 7px 12px 7px 7px;
      font-size: 0.78rem;
      max-width: 160px;
    }

    &__thumb {
      width: 28px;
      height: 28px;
    }
  }
}
</style>
