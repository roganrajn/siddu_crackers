import { roundMoney } from './pricing.js';

export { roundMoney };

export const DEFAULT_ORDER_SETTINGS = {
  min_order_amount: 5000,
  order_packing_percentage: 5,
  gst_enabled: true,
  gst_percentage: 18,
  gst_number: '33ABAFD1628C1Z6',
};

// States exempt from GST
export const GST_EXEMPT_STATES = [
  'tamil nadu',
  'puducherry',
  'pondicherry',
];

export function normalizeOrderSettings(settings = {}) {
  return {
    min_order_amount: parseFloat(settings.min_order_amount ?? DEFAULT_ORDER_SETTINGS.min_order_amount),
    order_packing_percentage: parseFloat(settings.order_packing_percentage ?? DEFAULT_ORDER_SETTINGS.order_packing_percentage),
    gst_enabled: settings.gst_enabled ?? DEFAULT_ORDER_SETTINGS.gst_enabled,
    gst_percentage: parseFloat(settings.gst_percentage ?? DEFAULT_ORDER_SETTINGS.gst_percentage),
    gst_number: settings.gst_number ?? DEFAULT_ORDER_SETTINGS.gst_number,
  };
}

export function isGstApplicable(state, settings = {}) {
  if (!settings.gst_enabled) return false;
  if (!state) return false;
  const normalizedState = state.toLowerCase().trim();
  return !GST_EXEMPT_STATES.includes(normalizedState);
}

export function calculateGst(taxableAmount, gstPercentage) {
  if (taxableAmount <= 0 || gstPercentage <= 0) return 0;
  return roundMoney(taxableAmount * gstPercentage / 100);
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

/**
 * Product-level discounts are already in offer prices.
 * Summary: MRP subtotal → product savings → offer subtotal → packing → GST → net.
 */
export function calculateOrderBreakdown(items, settings = {}, state = null) {
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
  const afterPacking = roundMoney(afterDiscount + packingAmount);

  // GST calculation: apply on taxable amount (after discount + packing)
  const gstApplicable = isGstApplicable(state, cfg);
  const taxableAmount = gstApplicable ? afterPacking : 0;
  const gstAmount = gstApplicable ? calculateGst(afterPacking, cfg.gst_percentage) : 0;
  const netAmount = roundMoney(afterPacking + gstAmount);

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
    gst_applicable: gstApplicable,
    gst_percentage: gstApplicable ? cfg.gst_percentage : 0,
    gst_amount: gstAmount,
    gst_number: cfg.gst_number,
    taxable_amount: taxableAmount,
    net_amount: netAmount,
    min_order_amount: cfg.min_order_amount,
  };
}

export function getStoredOrderBreakdown(order) {
  if (order?.subtotal_mrp != null && order?.net_amount != null) {
    const subtotalMrp = parseFloat(order.subtotal_mrp);
    const legacySpecial = parseFloat(order.special_discount_amount ?? 0) > 0;
    const afterDiscount = legacySpecial
      ? parseFloat(order.after_special_discount ?? order.after_discount ?? 0)
      : parseFloat(order.after_discount ?? order.subtotal_offer ?? 0);
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
      gst_applicable: order.gst_applicable ?? false,
      gst_percentage: parseFloat(order.gst_percentage ?? 0),
      gst_amount: parseFloat(order.gst_amount ?? 0),
      gst_number: order.gst_number ?? DEFAULT_ORDER_SETTINGS.gst_number,
      taxable_amount: parseFloat(order.taxable_amount ?? 0),
      net_amount: parseFloat(order.net_amount ?? order.total_amount ?? 0),
    };
  }
  return null;
}

export function getLineMrpTotal(item) {
  return roundMoney(getItemMrp(item) * parseInt(item.quantity, 10));
}

export function getLineOfferTotal(item) {
  return roundMoney(getItemOffer(item) * parseInt(item.quantity, 10));
}

export function hasOfferDiscount(item) {
  return getItemMrp(item) > getItemOffer(item);
}
