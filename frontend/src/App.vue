<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/composables/useTheme';

const settingsStore = useSettingsStore();
useTheme();

onMounted(() => {
  settingsStore.fetchSettings();
});
</script>
