-- GST on orders: enabled flag, percentage, amount
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_gst_percentage DECIMAL(5, 2) DEFAULT 18;
UPDATE website_settings SET order_gst_percentage = 18 WHERE order_gst_percentage IS NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;

UPDATE orders SET gst_enabled = COALESCE(gst_enabled, false);
UPDATE orders SET gst_percentage = COALESCE(gst_percentage, 0);
UPDATE orders SET gst_amount = COALESCE(gst_amount, 0);
