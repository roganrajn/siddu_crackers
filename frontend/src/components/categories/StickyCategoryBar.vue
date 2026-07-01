<template>
  <div class="sticky-bar" :class="{ visible: isVisible }">
    <div class="sticky-bar__scroll">
      <div class="container sticky-bar__inner">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="sticky-bar__item"
          :class="{ active: activeSlug === cat.slug }"
          @click="$emit('select', cat)"
        >
          <span v-if="cat.icon" class="sticky-bar__icon">{{ cat.icon }}</span>
          {{ cat.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
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
    gap: 6px;
    padding: 10px 18px;
    border: 2px solid $border;
    border-radius: 25px;
    background: $white;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.2;
    color: $text-dark;
    cursor: pointer;
    transition: $transition;
    white-space: nowrap;

    &:hover,
    &.active {
      border-color: $primary;
      background: $primary;
      color: $white;
    }
  }

  &__icon {
    font-size: 1rem;
    line-height: 1;
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
      padding: 9px 14px;
      font-size: 0.78rem;
    }
  }
}
</style>
