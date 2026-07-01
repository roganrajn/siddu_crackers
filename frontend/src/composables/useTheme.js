import { watch } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';

const DEFAULTS = {
  primary_color: '#7D3C5E',
  secondary_color: '#F04E8B',
  accent_color: '#00A9B0',
};

export function useTheme() {
  const settingsStore = useSettingsStore();

  const applyTheme = () => {
    const s = { ...DEFAULTS, ...settingsStore.settings };
    const root = document.documentElement;
    root.style.setProperty('--color-primary', s.primary_color);
    root.style.setProperty('--color-secondary', s.secondary_color);
    root.style.setProperty('--color-accent', s.accent_color);
    root.style.setProperty('--color-background', '#FDF8F0');
    if (s.meta_title) document.title = s.meta_title;
    if (s.meta_description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', s.meta_description);
    }
  };

  watch(() => settingsStore.settings, applyTheme, { deep: true, immediate: true });

  return { applyTheme };
}
