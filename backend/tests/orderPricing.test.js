import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderBreakdown,
  resolveGstApplicableFromState,
  getStoredOrderBreakdown,
  getOrderGstApplicable,
} from '../src/utils/orderPricing.js';

const items = [{ product_name: 'Test', price: 100, mrp_price: 100, quantity: 1 }];
const gstOn = { gst_enabled: true, gst_percentage: 18, order_packing_percentage: 5, gst_number: '33ABAFD1628C1Z6' };
const gstOff = { ...gstOn, gst_enabled: false };

test('no GST until a delivery state is selected', () => {
  const breakdown = calculateOrderBreakdown(items, gstOn, '');
  assert.equal(breakdown.gst_applicable, false);
  assert.equal(breakdown.gst_amount, 0);
});

test('no GST for Tamil Nadu and Pondicherry when GST is enabled', () => {
  for (const state of ['Tamil Nadu', 'Puducherry', 'Pondicherry']) {
    const breakdown = calculateOrderBreakdown(items, gstOn, state);
    assert.equal(resolveGstApplicableFromState(state), false);
    assert.equal(breakdown.gst_applicable, false);
    assert.equal(breakdown.gst_amount, 0);
  }
});

test('18% GST for other states when GST is enabled', () => {
  const breakdown = calculateOrderBreakdown(items, gstOn, 'Assam');
  assert.equal(breakdown.gst_applicable, true);
  assert.equal(breakdown.gst_percentage, 18);
  assert.equal(breakdown.gst_amount, 21); // (100 + 5 packing) * 18%
  assert.equal(breakdown.net_amount, 126);
});

test('GST disabled in settings means no GST at checkout unless admin forces it', () => {
  const otherState = calculateOrderBreakdown(items, gstOff, 'Assam');
  const tn = calculateOrderBreakdown(items, gstOff, 'Tamil Nadu');
  const forced = calculateOrderBreakdown(items, { ...gstOff, gst_applicable: true }, 'Assam');

  assert.equal(otherState.gst_applicable, false);
  assert.equal(otherState.gst_amount, 0);
  assert.equal(tn.gst_applicable, false);
  assert.equal(forced.gst_applicable, true);
  assert.equal(forced.gst_amount, 21);
});

test('admin can force GST off for a non-exempt state when GST is enabled', () => {
  const breakdown = calculateOrderBreakdown(items, { ...gstOn, gst_applicable: false }, 'Assam');
  assert.equal(breakdown.gst_applicable, false);
  assert.equal(breakdown.gst_amount, 0);
});

test('admin can force GST on when GST is enabled', () => {
  const breakdown = calculateOrderBreakdown(items, { ...gstOn, gst_applicable: true }, 'Tamil Nadu');
  assert.equal(breakdown.gst_applicable, true);
  assert.equal(breakdown.gst_amount, 21);
});

test('getOrderGstApplicable defaults to false', () => {
  assert.equal(getOrderGstApplicable({ gst_applicable: null }), false);
  assert.equal(getOrderGstApplicable({ gst_applicable: true }), true);
  assert.equal(getOrderGstApplicable({ gst_applicable: false }), false);
});

test('stored orders keep their own GST flag for display', () => {
  const withoutGst = getStoredOrderBreakdown({
    subtotal_mrp: 28500,
    after_discount: 5700,
    discount_amount: 22800,
    packing_percentage: 3,
    packing_amount: 171,
    net_amount: 5871,
    gst_applicable: false,
  }, gstOn);

  assert.equal(withoutGst.gst_applicable, false);
  assert.equal(withoutGst.gst_amount, 0);
  assert.equal(withoutGst.net_amount, 5871);

  const withGst = getStoredOrderBreakdown({
    subtotal_mrp: 28500,
    after_discount: 5700,
    discount_amount: 22800,
    packing_percentage: 3,
    packing_amount: 171,
    net_amount: 6927.78,
    gst_applicable: true,
    gst_percentage: 18,
  }, gstOn);

  assert.equal(withGst.gst_applicable, true);
  assert.equal(withGst.gst_amount, 1056.78);
  assert.equal(withGst.net_amount, 6927.78);
});
