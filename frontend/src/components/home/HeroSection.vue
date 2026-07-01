<template>
  <section class="hero">
    <div class="hero__fireworks">
      <span v-for="n in 12" :key="n" class="firework" :style="fireworkStyle(n)">✨</span>
    </div>
    <div class="container hero__content">
      <div class="hero__text">
        <span class="hero__badge">🔥 {{ settings.offer_banner || '80% Discount' }}</span>
        <h1 class="hero__title">
          <span class="hero__brand">{{ settings.company_name || 'SIDDU CRACKERS' }}</span>
        </h1>
        <p class="hero__subtitle">Direct from Sivakasi • Premium Quality • Best Prices</p>
        <div class="hero__actions">
          <a href="#products" class="btn btn--large">Book Your Order Now</a>
          <a :href="whatsappLink" target="_blank" class="btn btn--secondary btn--large">WhatsApp Us</a>
        </div>
      </div>
      <div class="hero__visual">
        <div class="hero__cracker">🎆</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { getWhatsAppLink } from '@/utils/helpers';

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const whatsappLink = computed(() => getWhatsAppLink(settings.value.whatsapp, 'Hi! I want to order crackers from Siddu Crackers.'));

function fireworkStyle(n) {
  return {
    left: `${(n * 8) % 100}%`,
    top: `${(n * 13) % 80}%`,
    animationDelay: `${n * 0.3}s`,
    fontSize: `${12 + (n % 3) * 6}px`,
  };
}
</script>

<style lang="scss" scoped>
.hero {
  position: relative;
  min-height: 500px;
  @include orange-gradient;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 60px 0;

  &__fireworks {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .firework {
      position: absolute;
      animation: sparkle 2s ease-in-out infinite;
      opacity: 0.6;
    }
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 1;
    gap: 40px;
  }

  &__badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    padding: 8px 20px;
    border-radius: 25px;
    color: $white;
    font-weight: 600;
    margin-bottom: 16px;
    animation: pulse 2s ease-in-out infinite;
  }

  &__title {
    margin-bottom: 12px;
  }

  &__brand {
    font-size: 3rem;
    font-weight: 800;
    color: $white;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.2);
    line-height: 1.1;
  }

  &__subtitle {
    font-size: 1.2rem;
    color: rgba(255,255,255,0.9);
    margin-bottom: 32px;
  }

  &__actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    .btn--large {
      width: auto;
      background: $white;
      color: $primary;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      }
    }
  }

  &__visual {
    flex-shrink: 0;
  }

  &__cracker {
    font-size: 150px;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 10px 30px rgba(0,0,0,0.2));
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 400px;
    padding: 40px 0;

    &__content {
      flex-direction: column;
      text-align: center;
    }

    &__brand {
      font-size: 2rem;
    }

    &__cracker {
      font-size: 80px;
    }

    &__actions {
      justify-content: center;
    }
  }
}
</style>
