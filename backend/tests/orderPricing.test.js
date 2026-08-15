import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderBreakdown,
  resolveBillType,
} from '../src/utils/orderPricing.js';

test('resolveBillType defaults to with_gst outside exempt states', () => {
  assert.equal(resolveBillType('Assam', { gst_enabled: true }), 'with_gst');
  assert.equal(resolveBillType('Kerala', { gst_enabled: true }), 'with_gst');
});

test('resolveBillType defaults to without_gst for exempt states', () => {
  assert.equal(resolveBillType('Tamil Nadu', { gst_enabled: true }), 'without_gst');
  assert.equal(resolveBillType('Puducherry', { gst_enabled: true }), 'without_gst');
  assert.equal(resolveBillType('Pondicherry', { gst_enabled: true }), 'without_gst');
});

test('calculateOrderBreakdown applies GST for non-exempt states and skips it for exempt states', () => {
  const items = [{ product_name: 'Test', price: 100, mrp_price: 100, quantity: 1 }];
  const nonExempt = calculateOrderBreakdown(items, { gst_enabled: true, gst_percentage: 18, order_packing_percentage: 5 }, 'Assam');
  const exempt = calculateOrderBreakdown(items, { gst_enabled: true, gst_percentage: 18, order_packing_percentage: 5 }, 'Tamil Nadu');

  assert.equal(nonExempt.gst_applicable, true);
  assert.equal(nonExempt.gst_amount > 0, true);
  assert.equal(nonExempt.net_amount > 0, true);

  assert.equal(exempt.gst_applicable, false);
  assert.equal(exempt.gst_amount, 0);
  assert.equal(exempt.net_amount, exempt.after_discount + exempt.packing_amount);
});

test('calculateOrderBreakdown respects explicit bill type override and keeps GSTIN', () => {
  const items = [{ product_name: 'Test', price: 100, mrp_price: 100, quantity: 1 }];
  const withGst = calculateOrderBreakdown(items, {
    gst_enabled: true,
    gst_percentage: 18,
    order_packing_percentage: 5,
    gst_number: '33ABAFD1628C1Z6',
    bill_type: 'with_gst',
  }, 'Assam');
  const withoutGst = calculateOrderBreakdown(items, {
    gst_enabled: true,
    gst_percentage: 18,
    order_packing_percentage: 5,
    gst_number: '33ABAFD1628C1Z6',
    bill_type: 'without_gst',
  }, 'Assam');

  assert.equal(withGst.gst_applicable, true);
  assert.equal(withGst.gst_amount, 21);
  assert.equal(withoutGst.gst_applicable, false);
  assert.equal(withoutGst.gst_amount, 0);
  assert.equal(withoutGst.gst_number, '33ABAFD1628C1Z6');
  assert.equal(withoutGst.net_amount, withoutGst.after_discount + withoutGst.packing_amount);
});
