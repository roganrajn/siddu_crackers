-- Backfill GST fields for orders where bill_type = with_gst but GST was not persisted.
-- Run once in production after deploying the GST calculation fix.

UPDATE orders
SET
  gst_applicable = true,
  gst_percentage = COALESCE(gst_percentage, 18),
  gst_amount = ROUND((after_discount + packing_amount) * COALESCE(gst_percentage, 18) / 100, 2),
  taxable_amount = after_discount + packing_amount,
  gst_number = COALESCE(gst_number, '33ABAFD1628C1Z6'),
  net_amount = ROUND(after_discount + packing_amount + (after_discount + packing_amount) * COALESCE(gst_percentage, 18) / 100, 2),
  total_amount = ROUND(after_discount + packing_amount + (after_discount + packing_amount) * COALESCE(gst_percentage, 18) / 100, 2),
  updated_at = CURRENT_TIMESTAMP
WHERE bill_type = 'with_gst'
  AND (gst_applicable IS NULL OR gst_amount IS NULL OR gst_amount = 0)
  AND after_discount IS NOT NULL
  AND packing_amount IS NOT NULL;

UPDATE orders
SET
  gst_applicable = false,
  gst_percentage = 0,
  gst_amount = 0,
  taxable_amount = 0,
  net_amount = after_discount + packing_amount,
  total_amount = after_discount + packing_amount,
  updated_at = CURRENT_TIMESTAMP
WHERE bill_type = 'without_gst'
  AND (gst_applicable IS NULL OR gst_amount IS NULL OR gst_amount > 0)
  AND after_discount IS NOT NULL
  AND packing_amount IS NOT NULL;
