<template>
  <div :class="['pricing-summary', `pricing-summary--${variant}`]">
    <h4 v-if="showTitle" class="pricing-summary__title">Summary</h4>
    <div class="pricing-summary__rows">
      <div class="pricing-summary__row">
        <span>Sub Total</span>
        <span>{{ formatPrice(breakdown.subtotal_mrp) }}</span>
      </div>
      <div class="pricing-summary__row">
        <span>{{ breakdown.discount_label || 'Discount' }}</span>
        <span class="pricing-summary__negative">-{{ formatPrice(breakdown.discount_amount) }}</span>
      </div>
      <div class="pricing-summary__row">
        <span>After Discount</span>
        <span>{{ formatPrice(breakdown.after_discount) }}</span>
      </div>
      <div class="pricing-summary__row">
        <span>Packing ({{ formatPct(breakdown.packing_percentage) }})</span>
        <span>{{ formatPrice(breakdown.packing_amount) }}</span>
      </div>
      <template v-if="breakdown.gst_enabled">
        <div class="pricing-summary__row">
          <span>GST ({{ formatPct(breakdown.gst_rate) }} on After Discount)</span>
          <span>{{ formatPrice(breakdown.gst_amount) }}</span>
        </div>
      </template>
      <div class="pricing-summary__row pricing-summary__row--net">
        <span>{{ breakdown.gst_enabled ? 'Net Amount (incl. GST)' : 'Net Amount' }}</span>
        <strong>{{ formatPrice(breakdown.net_amount) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from '@/utils/helpers';

defineProps({
  breakdown: { type: Object, required: true },
  variant: { type: String, default: 'table' },
  showTitle: { type: Boolean, default: true },
});

function formatPct(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '0%';
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2).replace(/\.?0+$/, '')}%`;
}
</script>

<style lang="scss" scoped>
.pricing-summary__title {
  margin: 0 0 8px;
  font-size: 1rem;
  color: $primary-dark;
}

.pricing-summary__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pricing-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;

  span:last-child,
  strong {
    font-weight: 600;
    text-align: right;
  }
}

.pricing-summary__negative {
  color: #b91c1c;
}

.pricing-summary__row--net {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 2px solid $border;
  font-size: 1rem;

  strong {
    color: $primary;
    font-size: 1.15rem;
  }
}

.pricing-summary--table {
  align-self: flex-end;
  width: min(100%, 360px);

  .pricing-summary__rows {
    border: 1px solid #1f1f1f;
  }

  .pricing-summary__row {
    padding: 10px 12px;
    border-bottom: 1px solid #1f1f1f;
    margin: 0;

    &:nth-child(even) {
      background: #f7f3ef;
    }
  }

  .pricing-summary__row--net {
    background: $primary-dark !important;
    color: $white;
    border-bottom: none;
    margin-top: 0;
    padding-top: 12px;
    border-top: none;

    strong {
      color: $white;
    }
  }
}

.pricing-summary--compact {
  margin-bottom: 14px;

  .pricing-summary__row {
    font-size: 0.85rem;
    color: $text-dark;
  }

  .pricing-summary__row--net {
    font-size: 0.95rem;
  }
}

@media (max-width: 768px) {
  .pricing-summary--table {
    width: 100%;
  }
}

@media print {
  .pricing-summary--table .pricing-summary__row--net {
    background: #fff !important;
    color: #1a1a1a !important;
    border-top: 2px solid #1a1a1a !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;

    span,
    strong {
      color: #1a1a1a !important;
      font-weight: 700 !important;
    }

    strong {
      font-size: 0.95rem !important;
    }
  }
}
</style>
