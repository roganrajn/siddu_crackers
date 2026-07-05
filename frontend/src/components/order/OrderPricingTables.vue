<template>
  <div class="order-pricing">
    <div class="order-pricing__items-wrap">
      <table class="order-pricing__items">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Product</th>
            <th>MRP ₹</th>
            <th>Qty</th>
            <th>Total ₹</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="itemKey(item, index)">
            <td>{{ index + 1 }}</td>
            <td>{{ item.product_name }}</td>
            <td class="order-pricing__mrp-cell">
              <span v-if="hasOfferDiscount(item)" class="order-pricing__mrp-struck">
                {{ formatPrice(getItemMrp(item)) }}
              </span>
              <span class="order-pricing__offer-price">{{ formatPrice(getItemOffer(item)) }}</span>
            </td>
            <td>{{ item.quantity }}</td>
            <td class="order-pricing__line-total">{{ formatPrice(getLineOfferTotal(item)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="breakdown" class="order-pricing__summary-wrap">
      <h4 class="order-pricing__summary-title">Summary</h4>
      <table class="order-pricing__summary">
        <tbody>
          <tr>
            <td>Sub Total</td>
            <td>{{ formatPrice(breakdown.subtotal_mrp) }}</td>
          </tr>
          <tr>
            <td>{{ breakdown.discount_label || 'Discount' }}</td>
            <td class="negative">-{{ formatPrice(breakdown.discount_amount) }}</td>
          </tr>
          <tr>
            <td>After Discount</td>
            <td>{{ formatPrice(breakdown.after_discount) }}</td>
          </tr>
          <tr>
            <td>Packing ({{ formatPct(breakdown.packing_percentage) }})</td>
            <td>{{ formatPrice(breakdown.packing_amount) }}</td>
          </tr>
          <tr class="order-pricing__net-row">
            <td>Net Amount</td>
            <td>{{ formatPrice(breakdown.net_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="fallbackTotal != null" class="order-pricing__legacy-total">
      <strong>Grand Total:</strong> {{ formatPrice(fallbackTotal) }}
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from '@/utils/helpers';
import {
  getItemMrp,
  getItemOffer,
  getLineOfferTotal,
  hasOfferDiscount,
} from '@/utils/orderPricing';

defineProps({
  items: { type: Array, default: () => [] },
  breakdown: { type: Object, default: null },
  fallbackTotal: { type: Number, default: null },
});

function itemKey(item, index) {
  return item.id || item.product_id || `${item.product_name}-${index}`;
}

function formatPct(value) {
  const num = parseFloat(value);
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2).replace(/\.?0+$/, '')}%`;
}
</script>

<style lang="scss" scoped>
.order-pricing {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-pricing__items-wrap,
.order-pricing__summary-wrap {
  overflow-x: auto;
}

.order-pricing__items,
.order-pricing__summary {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #1f1f1f;
  font-size: 0.88rem;

  th, td {
    border: 1px solid #1f1f1f;
    padding: 10px 12px;
    text-align: left;
  }

  thead th {
    background: $primary-dark;
    color: $white;
    font-weight: 700;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) {
    background: #f7f3ef;
  }
}

.order-pricing__items {
  th:last-child,
  td:last-child {
    text-align: right;
  }

  th:nth-child(4),
  td:nth-child(4) {
    text-align: center;
  }
}

.order-pricing__mrp-cell {
  text-align: center;
  white-space: nowrap;
}

.order-pricing__mrp-struck {
  display: block;
  font-size: 0.78rem;
  color: $text-muted;
  text-decoration: line-through;
}

.order-pricing__offer-price {
  display: block;
  font-weight: 700;
  color: $primary;
}

.order-pricing__line-total {
  font-weight: 700;
  color: $primary;
  text-align: right;
}

.order-pricing__summary-wrap {
  align-self: flex-end;
  width: min(100%, 360px);
}

.order-pricing__summary-title {
  margin: 0 0 8px;
  font-size: 1rem;
  color: $primary-dark;
}

.order-pricing__summary {
  td:last-child {
    text-align: right;
    font-weight: 600;
  }

  .negative {
    color: #b91c1c;
  }
}

.order-pricing__net-row {
  background: $primary-dark !important;
  color: $white;

  td {
    font-weight: 700;
    border-color: $primary-dark;
  }
}

.order-pricing__legacy-total {
  text-align: right;
  font-size: 1.1rem;
  color: $primary;
}

@media (max-width: 768px) {
  .order-pricing__summary-wrap {
    width: 100%;
  }
}
</style>
