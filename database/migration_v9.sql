-- GST billing on orders (admin-toggled) and GST % in settings
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_gst_percentage DECIMAL(5, 2) DEFAULT 18;
UPDATE website_settings SET order_gst_percentage = 18 WHERE order_gst_percentage IS NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_applicable BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) DEFAULT 'without_gst';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);

UPDATE orders SET gst_enabled = COALESCE(gst_enabled, gst_applicable, false);
UPDATE orders SET gst_applicable = COALESCE(gst_applicable, gst_enabled, false);
UPDATE orders SET gst_rate = COALESCE(NULLIF(gst_rate, 0), gst_percentage, 0);
UPDATE orders SET gst_percentage = COALESCE(NULLIF(gst_percentage, 0), gst_rate, 0);
UPDATE orders SET gst_amount = COALESCE(gst_amount, 0);
UPDATE orders SET taxable_amount = COALESCE(taxable_amount, 0);
UPDATE orders SET bill_type = COALESCE(NULLIF(bill_type, ''), CASE WHEN COALESCE(gst_enabled, gst_applicable, false) THEN 'with_gst' ELSE 'without_gst' END);

