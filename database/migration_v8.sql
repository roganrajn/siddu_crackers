-- Order pricing settings
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10, 2) DEFAULT 5000;
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_discount_percentage DECIMAL(5, 2) DEFAULT 70;
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_special_discount_percentage DECIMAL(5, 2) DEFAULT 15;
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_packing_percentage DECIMAL(5, 2) DEFAULT 5;

UPDATE website_settings SET min_order_amount = 5000 WHERE min_order_amount IS NULL;
UPDATE website_settings SET order_discount_percentage = 70 WHERE order_discount_percentage IS NULL;
UPDATE website_settings SET order_special_discount_percentage = 15 WHERE order_special_discount_percentage IS NULL;
UPDATE website_settings SET order_packing_percentage = 5 WHERE order_packing_percentage IS NULL;

-- Order breakdown snapshot
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_mrp DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS after_discount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_discount_percentage DECIMAL(5, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_discount_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS after_special_discount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_percentage DECIMAL(5, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS mrp_price DECIMAL(10, 2);

UPDATE orders SET net_amount = total_amount WHERE net_amount IS NULL AND total_amount IS NOT NULL;
UPDATE orders SET subtotal_mrp = total_amount WHERE subtotal_mrp IS NULL AND total_amount IS NOT NULL;

UPDATE order_items SET mrp_price = price WHERE mrp_price IS NULL;
