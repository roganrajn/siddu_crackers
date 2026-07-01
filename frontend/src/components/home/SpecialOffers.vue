<template>
  <section class="special-offers">
    <div class="container">
      <div class="offers-banner">
        <div class="offers-banner__glow" aria-hidden="true" />
        <div class="offers-banner__left">
          <span class="offers-banner__icon" aria-hidden="true">🎁</span>
          <div class="offers-banner__text">
            <strong>Today's Special Offers</strong>
            <span>{{ settings.offer_banner || '80% Discount on All Crackers!' }}</span>
          </div>
        </div>
        <a href="#products" class="btn btn--gold btn--sm offers-banner__cta">Shop Now →</a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
</script>

<style lang="scss" scoped>
.special-offers {
  padding: 24px 0 8px;
  background: transparent;
}

.offers-banner {
  position: relative;
  @include card;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 32px;
  border: 1px solid rgba(232, 184, 74, 0.3);
  border-left: 5px solid $gold;
  overflow: hidden;
  background: linear-gradient(135deg, $white 0%, $background-warm 100%);

  &__glow {
    position: absolute;
    top: -50%;
    right: -10%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(240, 78, 139, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 18px;
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  &__icon {
    font-size: 2.2rem;
    flex-shrink: 0;
    line-height: 1;
    animation: float 3s ease-in-out infinite;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    strong {
      font-family: $font-display;
      color: $primary;
      font-size: 1.15rem;
      font-weight: 700;
    }

    span {
      color: $text-muted;
      font-size: 0.92rem;
      line-height: 1.4;
    }
  }

  &__cta {
    flex-shrink: 0;
    white-space: nowrap;
    position: relative;
    z-index: 1;
  }
}

@media (max-width: 768px) {
  .special-offers { padding: 16px 0 4px; }

  .offers-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px;
    text-align: center;

    &__left {
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    &__cta { width: 100%; }
  }
}
</style>
