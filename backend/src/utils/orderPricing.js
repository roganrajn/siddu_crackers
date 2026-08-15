export function roundMoney(value) {
  return Math.round(parseFloat(value) * 100) / 100;
}

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
  return isGstApplicableForBillType(state, cfg, billType, settings);
}

/** Whether GST applies for a resolved bill type (explicit override ignores state exemption). */
export function isGstApplicableForBillType(state, cfg, billType, settings = {}) {
  if (billType === 'without_gst') return false;

  const explicitType = normalizeBillType(settings.bill_type ?? settings.gst_bill_type ?? cfg.bill_type);
  if (explicitType === 'with_gst') return true;
  if (explicitType === 'without_gst') return false;

  if (state) {
    return !GST_EXEMPT_STATES.includes(String(state).trim().toLowerCase());
  }

  return normalizeBoolean(cfg.gst_enabled, DEFAULT_ORDER_SETTINGS.gst_enabled);
}

export function getGstStatusLabel(breakdown) {
  if (!breakdown) return '';
  if (breakdown.gst_applicable && breakdown.gst_percentage > 0) {
    const pct = Number.isInteger(breakdown.gst_percentage)
      ? breakdown.gst_percentage
      : parseFloat(breakdown.gst_percentage).toFixed(2).replace(/\.?0+$/, '');
    return `GST Applicable – ${pct}%`;
  }
  return 'GST Not Applicable';
}

export function getBillTypeLabel(billType) {
  const normalized = normalizeBillType(billType);
  if (normalized === 'with_gst') return 'With GST';
  if (normalized === 'without_gst') return 'Without GST';
  return 'Auto';
}

/** Cart pricing — exclude GST until delivery state is known at checkout. */
export function calculateCartBreakdown(items, settings = {}) {
  return calculateOrderBreakdown(items, { ...settings, bill_type: 'without_gst' });
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

  const gstApplicable = isGstApplicableForBillType(state, cfg, billType, settings);
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

export function getStoredOrderBreakdown(order, settings = {}) {
  if (order?.subtotal_mrp != null && order?.net_amount != null) {
    const cfg = normalizeOrderSettings(settings);
    const subtotalMrp = parseFloat(order.subtotal_mrp);
    const afterDiscount = parseFloat(order.after_discount ?? 0);
    const discountAmount = parseFloat(order.discount_amount ?? Math.max(0, subtotalMrp - afterDiscount));
    const discountUptoPct = parseFloat(order.discount_upto_percentage ?? order.discount_percentage ?? 0);
    const packingPercentage = parseFloat(order.packing_percentage ?? cfg.order_packing_percentage ?? 0);
    const packingAmount = parseFloat(order.packing_amount ?? roundMoney(afterDiscount * packingPercentage / 100));
    const afterPacking = roundMoney(afterDiscount + packingAmount);

    const computedBillType = normalizeBillType(order.bill_type || 'auto');
    const effectiveBillType = computedBillType === 'auto'
      ? resolveBillType(order.state, { ...cfg, bill_type: 'auto' })
      : computedBillType;

    const gstApplicable = effectiveBillType === 'with_gst';
    const gstPercentage = gstApplicable
      ? parseFloat(order.gst_percentage ?? cfg.gst_percentage ?? DEFAULT_ORDER_SETTINGS.gst_percentage)
      : 0;
    const gstAmount = gstApplicable ? calculateGst(afterPacking, gstPercentage) : 0;
    const netAmount = roundMoney(afterPacking + gstAmount);

    return {
      subtotal_mrp: subtotalMrp,
      subtotal_offer: afterDiscount,
      discount_upto_percentage: discountUptoPct,
      discount_label: discountUptoPct ? `Upto ${discountUptoPct}% discount` : 'Discount',
      discount_amount: discountAmount,
      discount_percentage: discountUptoPct,
      after_discount: afterDiscount,
      packing_percentage: packingPercentage,
      packing_amount: packingAmount,
      bill_type: effectiveBillType,
      gst_applicable: gstApplicable,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      gst_number: order.gst_number ?? cfg.gst_number ?? DEFAULT_ORDER_SETTINGS.gst_number,
      taxable_amount: gstApplicable ? afterPacking : 0,
      net_amount: netAmount,
      min_order_amount: parseFloat(order.min_order_amount ?? cfg.min_order_amount ?? DEFAULT_ORDER_SETTINGS.min_order_amount),
    };
  }

  return null;
}
