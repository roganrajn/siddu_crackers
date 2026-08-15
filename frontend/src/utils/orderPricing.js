import { roundMoney } from './pricing.js';

export { roundMoney };

export const DEFAULT_ORDER_SETTINGS = {
  min_order_amount: 5000,
  order_packing_percentage: 5,
  gst_enabled: true,
  gst_percentage: 18,
  gst_number: '33ABAFD1628C1Z6',
  bill_type: 'auto',
};

export const GST_EXEMPT_STATES = [
  'tamil nadu',
  'puducherry',
  'pondicherry',
];

export function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return Boolean(value ?? fallback);
}

export function normalizeBillType(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'with_gst' || normalized === 'without_gst') return normalized;
  return 'auto';
}

export function resolveBillType(state = null, settings = {}) {
  const explicitType = normalizeBillType(settings.bill_type ?? settings.gst_bill_type);
  if (explicitType === 'with_gst' || explicitType === 'without_gst') return explicitType;

  if (!state) {
    return normalizeBoolean(settings.gst_enabled, DEFAULT_ORDER_SETTINGS.gst_enabled)
      ? 'with_gst'
      : 'without_gst';
  }

  const normalizedState = String(state).trim().toLowerCase();
  return GST_EXEMPT_STATES.includes(normalizedState) ? 'without_gst' : 'with_gst';
}

export function normalizeOrderSettings(settings = {}) {
  return {
    min_order_amount: parseFloat(settings.min_order_amount ?? DEFAULT_ORDER_SETTINGS.min_order_amount),
    order_packing_percentage: parseFloat(settings.order_packing_percentage ?? DEFAULT_ORDER_SETTINGS.order_packing_percentage),
    gst_enabled: normalizeBoolean(settings.gst_enabled, DEFAULT_ORDER_SETTINGS.gst_enabled),
    gst_percentage: parseFloat(settings.gst_percentage ?? DEFAULT_ORDER_SETTINGS.gst_percentage),
    gst_number: settings.gst_number ?? DEFAULT_ORDER_SETTINGS.gst_number,
    bill_type: normalizeBillType(settings.bill_type ?? settings.gst_bill_type ?? DEFAULT_ORDER_SETTINGS.bill_type),
  };
}

export function isGstApplicable(state, settings = {}) {
  const cfg = normalizeOrderSettings(settings);
  const billType = resolveBillType(state, cfg);
  if (billType === 'without_gst') return false;
  if (!cfg.gst_enabled) return false;
  if (!state) return true;
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
  const billType = resolveBillType(state, cfg);

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

  const gstApplicable = billType === 'with_gst' && isGstApplicable(state, cfg);
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
    bill_type: billType,
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
    const normalizedBillType = normalizeBillType(order.bill_type || 'auto');
    const effectiveBillType = normalizedBillType === 'auto' ? resolveBillType(order.state, { gst_enabled: order.gst_applicable !== false }) : normalizedBillType;

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
      bill_type: effectiveBillType,
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
