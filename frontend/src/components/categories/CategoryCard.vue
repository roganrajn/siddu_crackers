<template>
  <a :href="`#category-${category.slug}`" class="category-card" @click.prevent="$emit('select', category)">
    <div class="category-card__icon">{{ categoryIcons[category.slug] || '🎇' }}</div>
    <h3 class="category-card__name">{{ category.name }}</h3>
  </a>
</template>

<script setup>
defineProps({
  category: { type: Object, required: true },
});

defineEmits(['select']);

const categoryIcons = {
  'lakshmi-crackers': '🪔',
  'bijili': '⚡',
  'flower-pots': '🌸',
  'rockets': '🚀',
  'bombs': '💣',
  'ground-chakkars': '🌀',
  'kids-special': '👶',
  'gift-boxes': '🎁',
  'fancy-crackers': '✨',
  'sparklers': '🎇',
};
</script>

<style lang="scss" scoped>
.category-card {
  @include card;
  @include hover-lift;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    border-color: $primary;
  }

  &__icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }

  &__name {
    font-size: 0.9rem;
    font-weight: 600;
    color: $text-dark;
  }
}
</style>
