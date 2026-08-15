-- Default all existing orders to without GST (gst_applicable = false).
-- Recalculate totals without GST for orders with pricing breakdown fields.

UPDATE orders SET
  gst_applicable = false,
  bill_type = 'without_gst',
  gst_percentage = 0,
  gst_amount = 0,
  taxable_amount = 0,
  net_amount = ROUND((COALESCE(after_discount, 0) + COALESCE(packing_amount, 0))::numeric, 2),
  total_amount = ROUND((COALESCE(after_discount, 0) + COALESCE(packing_amount, 0))::numeric, 2)
WHERE after_discount IS NOT NULL
  AND packing_amount IS NOT NULL;

UPDATE orders SET
  gst_applicable = false,
  bill_type = 'without_gst'
WHERE gst_applicable IS NULL;

ALTER TABLE orders ALTER COLUMN gst_applicable SET DEFAULT false;
