<template>
  <footer class="footer">
    <div class="footer__pattern" aria-hidden="true" />
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <div class="footer__logo-wrap">
            <img :src="logoSrc" :alt="settings.company_name" class="footer__logo" loading="lazy" />
          </div>
          <p class="footer__tagline">Premium firecrackers direct from Sivakasi</p>
          <p>{{ settings.address }}</p>
        </div>
        <div class="footer__contact">
          <h4>Contact Us</h4>
          <p>📞 {{ settings.phone }}</p>
          <p>💬 {{ settings.whatsapp }}</p>
          <p>✉️ {{ settings.email }}</p>
        </div>
        <div class="footer__social">
          <h4>Follow Us</h4>
          <div class="social-links">
            <a v-if="settings.facebook" :href="settings.facebook" target="_blank">Facebook</a>
            <a v-if="settings.instagram" :href="settings.instagram" target="_blank">Instagram</a>
            <a v-if="settings.youtube" :href="settings.youtube" target="_blank">YouTube</a>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <p>{{ settings.copyright_text || settings.footer_text || '© 2026 Siddu Crackers. Direct from Sivakasi.' }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import defaultLogo from '@/assets/logo.png';

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const logoSrc = computed(() => settings.value.logo || defaultLogo);
</script>

<style lang="scss" scoped>
.footer {
  position: relative;
  background: linear-gradient(160deg, $primary-dark 0%, #2a1220 50%, $primary-dark 100%);
  color: rgba(255,255,255,0.88);
  padding: 56px 0 28px;
  margin-top: 80px;
  overflow: hidden;

  &__pattern {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(240, 78, 139, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(0, 169, 176, 0.06) 0%, transparent 40%),
      radial-gradient(circle at 50% 50%, rgba(232, 184, 74, 0.04) 0%, transparent 60%);
    pointer-events: none;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 36px;
    margin-bottom: 36px;
    position: relative;
    z-index: 1;
  }

  &__logo-wrap {
    display: inline-flex;
    padding: 8px 16px;
    background: rgba(255,255,255,0.06);
    border-radius: $radius;
    border: 1px solid rgba(232, 184, 74, 0.25);
    margin-bottom: 14px;
  }

  &__logo {
    display: block;
    height: 76px;
    width: auto;
    max-width: 180px;
    object-fit: contain;
    object-position: left center;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
  }

  &__tagline {
    color: $gold-light !important;
    font-weight: 600;
    font-size: 0.95rem !important;
    margin-bottom: 10px !important;
  }

  h4 {
    font-family: $font-display;
    color: $gold;
    margin-bottom: 14px;
    font-size: 1.05rem;
  }

  p {
    margin-bottom: 8px;
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .social-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    a {
      color: $gold-light;
      font-weight: 600;
      padding: 6px 14px;
      border: 1px solid rgba(232, 184, 74, 0.3);
      border-radius: 20px;
      transition: $transition;

      &:hover {
        color: $primary-dark;
        background: $gold;
        border-color: $gold;
      }
    }
  }

  &__bottom {
    border-top: 1px solid rgba(232, 184, 74, 0.15);
    padding-top: 24px;
    text-align: center;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.55);
    position: relative;
    z-index: 1;
  }
}

@media (max-width: 768px) {
  .footer__grid {
    grid-template-columns: 1fr;
    gap: 32px;
    text-align: center;
  }

  .footer__logo-wrap {
    margin-left: auto;
    margin-right: auto;
  }

  .footer__logo {
    height: 64px;
    max-width: 150px;
    margin-left: auto;
    margin-right: auto;
    object-position: center;
  }

  .social-links { justify-content: center; }
}
</style>
