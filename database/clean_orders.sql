-- Empty all order data before production migration.
-- Keeps: banners, categories, products, settings, admin users, reviews, etc.

BEGIN;

-- Order-related notifications (optional — clears admin notification history)
DELETE FROM notifications WHERE type = 'new_order';

TRUNCATE TABLE order_logs, order_items, orders RESTART IDENTITY CASCADE;

COMMIT;

-- Verify
SELECT 'orders' AS table_name, COUNT(*) AS rows FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'order_logs', COUNT(*) FROM order_logs
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products;
