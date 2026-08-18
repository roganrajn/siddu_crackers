-- GST billing on orders (admin-toggled) and GST % in settings
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_gst_percentage DECIMAL(5, 2) DEFAULT 18;
UPDATE website_settings SET order_gst_percentage = 18 WHERE order_gst_percentage IS NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;

UPDATE orders SET gst_enabled = false WHERE gst_enabled IS NULL;
UPDATE orders SET gst_rate = 0 WHERE gst_rate IS NULL;
UPDATE orders SET gst_amount = 0 WHERE gst_amount IS NULL;
