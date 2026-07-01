<template>
  <section class="hero-slider" aria-label="Featured offers">
    <div class="hero-slider__track" :style="{ transform: `translateX(-${current * 100}%)` }">
      <div
        v-for="(slide, i) in slides"
        :key="slide.id || i"
        class="hero-slide"
        :class="{ 'hero-slide--active': current === i }"
      >
        <!-- Media layer -->
        <div class="hero-slide__media">
          <img
            v-if="slide.image_url && isActive(i)"
            :src="slide.image_url"
            :alt="slide.title"
            class="hero-slide__img"
            :class="{ loaded: loadedImages.has(slide.image_url) }"
            @load="onImageLoad(slide.image_url)"
          />
          <div v-else-if="!slide.image_url" class="hero-slide__fallback" />
          <div v-else class="hero-slide__fallback hero-slide__fallback--loading" />
        </div>

        <!-- Overlays -->
        <div class="hero-slide__overlay" />
        <div class="hero-slide__sparkles" aria-hidden="true">
          <span v-for="n in 12" :key="n" class="sparkle" :style="sparkleStyle(n)" />
        </div>

        <!-- Content -->
        <div class="container hero-slide__content">
          <div class="hero-slide__text">
            <span class="hero-slide__tag">✨ Premium from Sivakasi</span>
            <h1>{{ slide.title }}</h1>
            <p v-if="slide.subtitle">{{ slide.subtitle }}</p>
            <a :href="slide.button_link || '#products'" class="btn btn--gold btn--large hero-slide__cta">
              {{ slide.button_text || 'Shop Now' }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="slides.length > 1" class="hero-slider__dots">
      <button
        v-for="(_, i) in slides"
        :key="i"
        :class="{ active: current === i }"
        :aria-label="`Go to slide ${i + 1}`"
        @click="goTo(i)"
      />
    </div>

    <button
      v-if="slides.length > 1"
      class="hero-slider__arrow hero-slider__arrow--prev"
      aria-label="Previous slide"
      @click="prev"
    >‹</button>
    <button
      v-if="slides.length > 1"
      class="hero-slider__arrow hero-slider__arrow--next"
      aria-label="Next slide"
      @click="next"
    >›</button>

    <div class="hero-slider__scroll-hint" aria-hidden="true">
      <span>Scroll to explore</span>
      <span class="hero-slider__scroll-arrow">↓</span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useBannerStore } from '@/stores/bannerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DEFAULT_BANNER_IMAGES, DEFAULT_HERO_SLIDES } from '@/constants/banners';

const bannerStore = useBannerStore();
const settingsStore = useSettingsStore();

const current = ref(0);
const loadedImages = ref(new Set());
let timer = null;

const slides = computed(() => {
  let raw = bannerStore.banners.length ? [...bannerStore.banners] : [...DEFAULT_HERO_SLIDES];

  if (bannerStore.banners.length) {
    raw = raw.map((slide, i) => ({
      ...slide,
      image_url: slide.image_url || DEFAULT_BANNER_IMAGES[i % DEFAULT_BANNER_IMAGES.length],
    }));
  }

  if (!raw.length) {
    const s = settingsStore.settings;
    return [{
      id: 0,
      title: s.company_name || 'SIDDU CRACKERS',
      subtitle: s.offer_banner || '80% Discount · Direct from Sivakasi',
      button_text: 'Book Your Order Now',
      button_link: '#products',
      image_url: DEFAULT_BANNER_IMAGES[0],
    }];
  }

  return raw;
});

function isActive(i) {
  return current.value === i || current.value === i - 1 || current.value === i + 1
    || (current.value === 0 && i === slides.value.length - 1)
    || (current.value === slides.value.length - 1 && i === 0);
}

function onImageLoad(url) {
  loadedImages.value = new Set([...loadedImages.value, url]);
}

function sparkleStyle(n) {
  const left = ((n * 37) % 100);
  const top = ((n * 53) % 100);
  const delay = (n * 0.35) % 3;
  const size = 3 + (n % 4);
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
  };
}

function next() { current.value = (current.value + 1) % slides.value.length; }
function prev() { current.value = (current.value - 1 + slides.value.length) % slides.value.length; }
function goTo(i) { current.value = i; resetTimer(); }

function resetTimer() {
  clearInterval(timer);
  timer = setInterval(next, 5500);
}

watch(current, () => {
  const slide = slides.value[current.value];
  if (slide?.image_url && !loadedImages.value.has(slide.image_url)) {
    const img = new Image();
    img.src = slide.image_url;
    img.onload = () => onImageLoad(slide.image_url);
  }
});

onMounted(async () => {
  await bannerStore.fetchBanners();
  const first = slides.value[0];
  if (first?.image_url) {
    const img = new Image();
    img.src = first.image_url;
    img.onload = () => onImageLoad(first.image_url);
  }
  timer = setInterval(next, 5500);
});

onUnmounted(() => clearInterval(timer));
</script>

<style lang="scss" scoped>
.hero-slider {
  position: relative;
  overflow: hidden;
  min-height: clamp(420px, 58vh, 620px);
  margin-top: -1px;

  &__track {
    display: flex;
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
    min-height: inherit;
  }

  &__dots {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 4;

    button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.8);
      background: transparent;
      cursor: pointer;
      padding: 0;
      transition: $transition;

      &.active {
        background: $gold;
        border-color: $gold;
        transform: scale(1.25);
        box-shadow: 0 0 12px rgba(232, 184, 74, 0.8);
      }

      &:hover:not(.active) { background: rgba(255,255,255,0.5); }
    }
  }

  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.3);
    color: $white;
    font-size: 2rem;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 4;
    transition: $transition;

    &:hover {
      background: rgba(255,255,255,0.3);
      border-color: $gold;
      color: $gold;
    }

    &--prev { left: 20px; }
    &--next { right: 20px; }
  }

  &__scroll-hint {
    position: absolute;
    bottom: 8px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.5);
    font-size: 0.75rem;
    z-index: 3;
    animation: float 2.5s ease-in-out infinite;

    @media (max-width: 768px) { display: none; }
  }

  &__scroll-arrow {
    font-size: 1rem;
    opacity: 0.7;
  }
}

.hero-slide {
  position: relative;
  min-width: 100%;
  min-height: clamp(420px, 58vh, 620px);
  display: flex;
  align-items: center;
  overflow: hidden;

  &__media {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0;
    transition: opacity 0.6s ease;
    transform: scale(1.05);

    &.loaded {
      opacity: 1;
      animation: hero-zoom 8s ease-out forwards;
    }
  }

  &__fallback {
    width: 100%;
    height: 100%;
    @include festive-gradient;

    &--loading {
      animation: shimmer 2s infinite;
      background: linear-gradient(90deg, $primary-dark 25%, $primary 50%, $primary-dark 75%);
      background-size: 200% 100%;
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(105deg, rgba(61, 26, 46, 0.82) 0%, rgba(61, 26, 46, 0.55) 45%, rgba(61, 26, 46, 0.25) 100%),
      linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%);
  }

  &__sparkles {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    overflow: hidden;
  }

  &__content {
    position: relative;
    z-index: 3;
    width: 100%;
  }

  &__text {
    max-width: 580px;
    color: $white;
    padding: 48px 0 72px;

    h1 {
      font-family: $font-display;
      font-size: clamp(2rem, 5vw, 3.2rem);
      font-weight: 800;
      margin-bottom: 16px;
      line-height: 1.1;
      text-shadow: 0 2px 20px rgba(0,0,0,0.4);
      letter-spacing: -0.02em;
    }

    p {
      font-size: clamp(1rem, 2vw, 1.2rem);
      margin-bottom: 32px;
      opacity: 0.92;
      line-height: 1.5;
      max-width: 480px;
    }
  }

  &__tag {
    display: inline-block;
    background: rgba(232, 184, 74, 0.2);
    border: 1px solid rgba(232, 184, 74, 0.5);
    color: $gold-light;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 16px;
    backdrop-filter: blur(4px);
  }

  &__cta {
    animation: glow-pulse 3s ease-in-out infinite;
  }
}

.sparkle {
  position: absolute;
  background: $gold-light;
  border-radius: 50%;
  animation: twinkle 2.5s ease-in-out infinite;
  box-shadow: 0 0 6px $gold;
}

@keyframes hero-zoom {
  from { transform: scale(1.08); }
  to { transform: scale(1); }
}

@media (max-width: 768px) {
  .hero-slider__arrow { display: none; }

  .hero-slide__text {
    padding: 32px 0 64px;
    text-align: center;

    p { margin-left: auto; margin-right: auto; }
  }

  .hero-slide__cta {
    width: 100%;
    max-width: 280px;
  }
}
</style>
