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

    <OrderPricingSummary
      v-if="breakdown"
      :breakdown="breakdown"
      variant="table"
    />

    <div v-else-if="fallbackTotal != null" class="order-pricing__legacy-total">
      <strong>Grand Total:</strong> {{ formatPrice(fallbackTotal) }}
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from '@/utils/helpers';
import OrderPricingSummary from '@/components/order/OrderPricingSummary.vue';
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
</script>

<style lang="scss" scoped>
.order-pricing {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-pricing__items-wrap {
  overflow-x: auto;
}
.order-pricing__items {
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

@media print {
  .order-pricing {
    gap: 12px;
  }

  .order-pricing__items-wrap {
    overflow: visible;
  }

  .order-pricing__items {
    thead {
      display: table-header-group;
    }

    tbody tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    th, td {
      padding: 5px 8px;
      font-size: 0.78rem;
    }
  }
}
</style>
