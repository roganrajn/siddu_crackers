<template>
  <a
    :href="whatsappLink"
    target="_blank"
    class="whatsapp-float"
    aria-label="Chat on WhatsApp"
  >
    💬
  </a>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { getWhatsAppLink } from '@/utils/helpers';

const settingsStore = useSettingsStore();
const whatsappLink = computed(() =>
  getWhatsAppLink(settingsStore.settings.whatsapp, 'Hi! I want to order crackers from Siddu Crackers.')
);
</script>

<style lang="scss" scoped>
.whatsapp-float {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 940;
  width: 56px;
  height: 56px;
  background: #25D366;
  color: $white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
  transition: $transition;
  animation: pulse 2s ease-in-out infinite;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
  }
}

@media (max-width: 768px) {
  .whatsapp-float {
    bottom: 90px;
  }
}
</style>
