<template>
  <div class="date-filters">
    <button
      v-for="preset in DATE_PRESETS"
      :key="preset.value"
      type="button"
      class="date-pill"
      :class="{ active: datePreset === preset.value }"
      @click="setDatePreset(preset.value)"
    >
      {{ preset.label }}
    </button>

    <div v-if="datePreset === 'custom'" class="custom-range">
      <input :value="customDateFrom" type="date" @input="onFromInput" />
      <span class="range-sep">to</span>
      <input :value="customDateTo" type="date" @input="onToInput" />
    </div>
  </div>
</template>

<script setup>
import { DATE_PRESETS } from '@/composables/useDateRangeFilter';

const datePreset = defineModel('datePreset', { type: String, default: '' });
const customDateFrom = defineModel('customDateFrom', { type: String, default: '' });
const customDateTo = defineModel('customDateTo', { type: String, default: '' });

const emit = defineEmits(['change']);

function setDatePreset(preset) {
  datePreset.value = preset;
  if (preset !== 'custom') {
    customDateFrom.value = '';
    customDateTo.value = '';
    emit('change');
  }
}

function onFromInput(e) {
  customDateFrom.value = e.target.value;
  if (customDateFrom.value && customDateTo.value) emit('change');
}

function onToInput(e) {
  customDateTo.value = e.target.value;
  if (customDateFrom.value && customDateTo.value) emit('change');
}
</script>

<style lang="scss">
@import '@/pages/admin/admin-shared.scss';
</style>
