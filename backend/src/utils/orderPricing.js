export function roundMoney(value) {
  return Math.round(parseFloat(value) * 100) / 100;
}

export const DEFAULT_ORDER_SETTINGS = {
  min_order_amount: 5000,
  order_packing_percentage: 5,
  order_gst_percentage: 18,
};

export function normalizeOrderSettings(settings = {}) {
  return {
    min_order_amount: parseFloat(settings.min_order_amount ?? DEFAULT_ORDER_SETTINGS.min_order_amount),
    order_packing_percentage: parseFloat(settings.order_packing_percentage ?? DEFAULT_ORDER_SETTINGS.order_packing_percentage),
    order_gst_percentage: parseFloat(
      settings.order_gst_percentage ?? settings.gst_percentage ?? DEFAULT_ORDER_SETTINGS.order_gst_percentage
    ),
  };
}

export function getItemMrp(item) {
  return roundMoney(item.mrp_price ?? item.original_price ?? item.price ?? 0);
}

export function getItemOffer(item) {
  return roundMoney(item.price ?? item.offer_price ?? item.mrp_price ?? 0);
}

export function getItemDiscountPct(item) {
  const mrp = getItemMrp(item);
  const offer = getItemOffer(item);
  if (!mrp || offer >= mrp) return 0;
  return Math.round(((mrp - offer) / mrp) * 100);
}

export function getMaxDiscountPct(items = []) {
  return items.reduce((max, item) => Math.max(max, getItemDiscountPct(item)), 0);
}

export function calculateOrderBreakdown(items, settings = {}) {
  const cfg = normalizeOrderSettings(settings);

  const subtotalMrp = roundMoney(
    items.reduce((sum, item) => sum + getItemMrp(item) * parseInt(item.quantity, 10), 0)
  );

  const subtotalOffer = roundMoney(
    items.reduce((sum, item) => sum + getItemOffer(item) * parseInt(item.quantity, 10), 0)
  );

  const discountAmount = roundMoney(subtotalMrp - subtotalOffer);
  const discountUptoPct = getMaxDiscountPct(items);
  const afterDiscount = subtotalOffer;

  const packingAmount = roundMoney(afterDiscount * cfg.order_packing_percentage / 100);
  const netAmount = roundMoney(afterDiscount + packingAmount);

  return {
    subtotal_mrp: subtotalMrp,
    subtotal_offer: subtotalOffer,
    discount_upto_percentage: discountUptoPct,
    discount_label: discountUptoPct ? `Upto ${discountUptoPct}% discount` : 'Discount',
    discount_amount: discountAmount,
    discount_percentage: discountUptoPct,
    after_discount: afterDiscount,
    special_discount_percentage: 0,
    special_discount_amount: 0,
    after_special_discount: afterDiscount,
    packing_percentage: cfg.order_packing_percentage,
    packing_amount: packingAmount,
    net_amount: netAmount,
    min_order_amount: cfg.min_order_amount,
  };
}

export function applyGstToBreakdown(breakdown, gstEnabled, gstRate = DEFAULT_ORDER_SETTINGS.order_gst_percentage) {
  const taxableAmount = roundMoney(parseFloat(breakdown.after_discount ?? 0));
  const packingAmount = roundMoney(parseFloat(breakdown.packing_amount ?? 0));
  const rate = parseFloat(gstRate ?? DEFAULT_ORDER_SETTINGS.order_gst_percentage);
  const enabled = Boolean(gstEnabled);
  const gstAmount = enabled ? roundMoney(taxableAmount * rate / 100) : 0;
  const netAmount = roundMoney(taxableAmount + packingAmount + gstAmount);

  return {
    ...breakdown,
    amount_before_gst: taxableAmount,
    gst_enabled: enabled,
    gst_rate: enabled ? rate : 0,
    gst_amount: gstAmount,
    net_amount: netAmount,
  };
}

export function getStoredOrderBreakdown(order) {
  if (order?.subtotal_mrp != null && order?.net_amount != null) {
    const subtotalMrp = parseFloat(order.subtotal_mrp);
    const afterDiscount = parseFloat(order.after_discount ?? 0);
    const discountAmount = parseFloat(order.discount_amount ?? Math.max(0, subtotalMrp - afterDiscount));
    const discountUptoPct = parseFloat(order.discount_upto_percentage ?? order.discount_percentage ?? 0);

    return {
      subtotal_mrp: subtotalMrp,
      subtotal_offer: afterDiscount,
      discount_upto_percentage: discountUptoPct,
      discount_label: discountUptoPct ? `Upto ${discountUptoPct}% discount` : 'Discount',
      discount_amount: discountAmount,
      discount_percentage: discountUptoPct,
      after_discount: afterDiscount,
      packing_percentage: parseFloat(order.packing_percentage ?? 0),
      packing_amount: parseFloat(order.packing_amount ?? 0),
      net_amount: parseFloat(order.net_amount ?? order.total_amount ?? 0),
      min_order_amount: parseFloat(order.min_order_amount ?? DEFAULT_ORDER_SETTINGS.min_order_amount),
    };
  }

  return null;
}
