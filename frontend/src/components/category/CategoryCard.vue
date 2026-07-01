<template>
  <a
    :href="`#category-${category.slug}`"
    class="category-card"
    :style="{ '--cat-color': category.color || '#7D3C5E' }"
    @click.prevent="$emit('select', category)"
  >
    <div class="category-card__visual">
      <img v-if="category.banner_image" :src="category.banner_image" :alt="category.name" loading="lazy" />
      <span v-else class="category-card__icon">{{ category.icon || '🎇' }}</span>
      <div class="category-card__shine" aria-hidden="true" />
    </div>
    <h3 class="category-card__name">{{ category.name }}</h3>
  </a>
</template>

<script setup>
defineProps({ category: { type: Object, required: true } });
defineEmits(['select']);
</script>

<style lang="scss" scoped>
.category-card {
  @include card;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: $transition;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $radius;
    background: linear-gradient(135deg, var(--cat-color), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
    pointer-events: none;
  }

  &:hover {
    border-color: var(--cat-color);
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(125, 60, 94, 0.18);

    &::before { opacity: 0.06; }

    .category-card__icon { transform: scale(1.15) rotate(-5deg); }
    .category-card__shine { opacity: 1; transform: translateX(100%); }
  }

  &__visual {
    position: relative;
    width: 100%;
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, var(--cat-color), color-mix(in srgb, var(--cat-color) 60%, white));
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__icon {
    font-size: 2.8rem;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.2));
    transition: transform 0.35s ease;
    z-index: 1;
  }

  &__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
    opacity: 0;
    transform: translateX(-100%);
    transition: transform 0.6s ease, opacity 0.3s ease;
    pointer-events: none;
  }

  &__name {
    padding: 14px 10px;
    font-size: 0.85rem;
    font-weight: 700;
    text-align: center;
    color: $text-dark;
    position: relative;
    z-index: 1;
    letter-spacing: 0.01em;
  }
}
</style>
