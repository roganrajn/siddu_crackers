<template>
  <div ref="headerRef" class="site-header">
    <!-- Festive promo bar -->
    <div class="promo-bar">
      <div class="promo-bar__track">
        <span v-for="n in 2" :key="n" class="promo-bar__text">
          🎆 {{ settings.offer_banner || '80% Discount on All Crackers!' }} &nbsp;·&nbsp;
          📞 Call or WhatsApp to order &nbsp;·&nbsp;
          🪔 Direct from Sivakasi &nbsp;·&nbsp;
        </span>
      </div>
    </div>

    <header class="header" :class="{ scrolled: isScrolled }">
      <div class="container header__inner">
        <router-link to="/" class="header__brand">
          <img
            :src="logoSrc"
            :alt="brandLabel.full"
            class="header__brand-logo"
          />
          <span class="header__brand-text">
            <span class="header__brand-name">{{ brandLabel.primary }}</span>
            <span v-if="brandLabel.secondary" class="header__brand-tagline">{{ brandLabel.secondary }}</span>
          </span>
        </router-link>

        <div class="header__search-wrap">
          <SearchDropdown class="header__search" />
        </div>

        <nav class="header__nav">
          <a :href="phoneLink" class="header__action header__action--call" title="Call us">
            <span>📞</span> Call
          </a>
          <a :href="whatsappLink" target="_blank" class="header__action header__action--whatsapp" title="WhatsApp">
            <span>💬</span> WhatsApp
          </a>
          <button class="header__cart" @click="cartStore.openDrawer()" aria-label="Open cart">
            🛒
            <span v-if="cartStore.itemCount" class="cart-badge">{{ cartStore.itemCount }}</span>
          </button>
        </nav>

        <button class="header__menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menu">☰</button>
      </div>

      <div v-if="mobileMenuOpen" class="mobile-menu">
        <SearchDropdown />
        <a :href="phoneLink">📞 Call Now</a>
        <a :href="whatsappLink" target="_blank">💬 WhatsApp</a>
      </div>
    </header>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCartStore } from '@/stores/cartStore';
import { getPhoneLink, getWhatsAppLink } from '@/utils/helpers';
import SearchDropdown from '@/components/common/SearchDropdown.vue';
import defaultLogo from '@/assets/logo.png';

const settingsStore = useSettingsStore();
const cartStore = useCartStore();
const settings = computed(() => settingsStore.settings);
const logoSrc = computed(() => settings.value.logo || defaultLogo);

const brandLabel = computed(() => {
  const name = (settings.value.company_name || 'Siddu Crackers').trim();
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return {
      primary: parts[0].toUpperCase(),
      secondary: parts.slice(1).join(' ').toUpperCase(),
      full: name,
    };
  }
  return { primary: name.toUpperCase(), secondary: '', full: name };
});

const isScrolled = ref(false);
const mobileMenuOpen = ref(false);
const headerRef = ref(null);

const phoneLink = computed(() => getPhoneLink(settings.value.phone));
const whatsappLink = computed(() => getWhatsAppLink(settings.value.whatsapp, 'Hi! I want to order crackers.'));

function updateHeaderHeight() {
  if (!headerRef.value) return;
  const height = headerRef.value.offsetHeight;
  document.documentElement.style.setProperty('--site-header-height', `${height}px`);
}

function handleScroll() { isScrolled.value = window.scrollY > 50; }

let resizeObserver = null;

watch(mobileMenuOpen, () => {
  requestAnimationFrame(updateHeaderHeight);
});

onMounted(() => {
  updateHeaderHeight();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', updateHeaderHeight, { passive: true });
  if (typeof ResizeObserver !== 'undefined' && headerRef.value) {
    resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', updateHeaderHeight);
  resizeObserver?.disconnect();
});
</script>

<style lang="scss" scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.promo-bar {
  height: $promo-bar-height;
  background: linear-gradient(90deg, $primary-dark, $primary, $secondary, $primary);
  background-size: 300% 100%;
  animation: promo-shimmer 8s ease infinite;
  overflow: hidden;
  display: flex;
  align-items: center;

  &__track {
    display: flex;
    white-space: nowrap;
    animation: marquee 25s linear infinite;
  }

  &__text {
    color: $white;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    padding-right: 0;
  }
}

@keyframes promo-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.header {
  background: rgba(255, 252, 248, 0.96);
  backdrop-filter: blur(16px);
  transition: $transition;
  border-bottom: 1px solid rgba(232, 184, 74, 0.2);

  &.scrolled {
    box-shadow: 0 4px 30px rgba(61, 31, 48, 0.12);
    background: rgba(255, 255, 255, 0.98);
    border-bottom-color: rgba(232, 184, 74, 0.4);
  }

  &__inner {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(240px, 480px) minmax(0, 1fr);
    align-items: center;
    gap: 20px;
    min-height: $header-height;
    padding: 8px 0;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-self: start;
    flex-shrink: 0;
    line-height: 1.1;
    padding: 4px 0;
    text-decoration: none;
    color: inherit;

    &:hover .header__brand-name {
      color: $primary;
    }
  }

  &__brand-logo {
    display: block;
    height: 64px;
    width: auto;
    max-width: 72px;
    object-fit: contain;
    object-position: left center;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 4px rgba(61, 31, 48, 0.12));
    transition: $transition;
  }

  &__brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__brand-name {
    font-family: $font-display;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: $primary;
    line-height: 1;
    transition: $transition;
  }

  &__brand-tagline {
    font-family: $font-family;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.28em;
    color: $primary;
    opacity: 0.88;
    line-height: 1;
  }

  &__search-wrap {
    justify-self: center;
    width: 100%;
    max-width: 480px;
  }

  &__search { width: 100%; }

  &__nav {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-self: end;
    flex-shrink: 0;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $text-dark;
    padding: 8px 14px;
    border-radius: 20px;
    white-space: nowrap;
    transition: $transition;

    &:hover {
      background: rgba(125, 60, 94, 0.08);
      color: $primary;
    }
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 9px 16px;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.8rem;
    transition: $transition;
    white-space: nowrap;

    &--call {
      background: $accent;
      color: $white;
      &:hover { background: $accent-dark; transform: translateY(-1px); }
    }

    &--whatsapp {
      background: #25D366;
      color: $white;
      &:hover { background: #1da851; transform: translateY(-1px); }
    }
  }

  &__cart {
    position: relative;
    background: rgba(125, 60, 94, 0.08);
    border: 1px solid rgba(125, 60, 94, 0.12);
    border-radius: 50%;
    font-size: 1.35rem;
    cursor: pointer;
    padding: 8px 10px;
    line-height: 1;
    transition: $transition;

    &:hover {
      background: rgba(125, 60, 94, 0.15);
      transform: scale(1.05);
    }

    .cart-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: $secondary;
      color: $white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid $white;
    }
  }

  &__menu-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: $primary;
    justify-self: end;
  }
}

.mobile-menu {
  display: none;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: $white;
  border-top: 1px solid $border;
  box-shadow: $shadow;

  :deep(.search-dropdown) { max-width: 100%; width: 100%; }

  a {
    padding: 12px;
    background: $background;
    border-radius: $radius-sm;
    font-weight: 600;
    text-align: center;
    color: $text-dark;
  }
}

@media (max-width: 1024px) {
  .header__inner {
    grid-template-columns: auto 1fr auto;
    gap: 12px;
  }

  .header__search-wrap { max-width: none; }
  .header__link { display: none; }
  .header__action { padding: 8px 12px; font-size: 0.75rem; }
}

@media (max-width: 768px) {
  .promo-bar__text { font-size: 0.72rem; }

  .header__inner {
    grid-template-columns: 1fr auto;
    gap: 12px;
  }

  .header__search-wrap,
  .header__nav { display: none; }

  .header__menu-btn { display: block; padding: 8px 12px; }

  .header__brand-logo {
    height: 52px;
    max-width: 56px;
  }

  .header__brand-name {
    font-size: 1.1rem;
  }

  .header__brand-tagline {
    font-size: 0.62rem;
    letter-spacing: 0.2em;
  }

  .mobile-menu { display: flex; }
}

@media (max-width: 400px) {
  .header__brand {
    gap: 8px;
  }

  .header__brand-logo {
    height: 44px;
    max-width: 48px;
  }

  .header__brand-name {
    font-size: 0.95rem;
  }

  .header__brand-tagline {
    font-size: 0.55rem;
    letter-spacing: 0.16em;
  }
}
</style>
