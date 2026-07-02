import { ref } from 'vue';

export const DATE_PRESETS = [
  { value: '', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'month', label: 'Current Month' },
  { value: 'custom', label: 'Custom Range' },
];

function formatDateParam(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useDateRangeFilter(onApply) {
  const datePreset = ref('');
  const customDateFrom = ref('');
  const customDateTo = ref('');

  function getDateRangeParams() {
    if (!datePreset.value) return {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (datePreset.value === 'today') {
      const d = formatDateParam(today);
      return { date_from: d, date_to: d };
    }

    if (datePreset.value === 'last7') {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { date_from: formatDateParam(from), date_to: formatDateParam(today) };
    }

    if (datePreset.value === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { date_from: formatDateParam(from), date_to: formatDateParam(today) };
    }

    if (datePreset.value === 'custom' && customDateFrom.value && customDateTo.value) {
      return { date_from: customDateFrom.value, date_to: customDateTo.value };
    }

    return {};
  }

  function setDatePreset(preset) {
    datePreset.value = preset;
    if (preset !== 'custom') {
      customDateFrom.value = '';
      customDateTo.value = '';
      onApply?.();
    }
  }

  function onCustomDateChange() {
    if (datePreset.value === 'custom' && customDateFrom.value && customDateTo.value) {
      onApply?.();
    }
  }

  return {
    datePreset,
    customDateFrom,
    customDateTo,
    getDateRangeParams,
    setDatePreset,
    onCustomDateChange,
  };
}
