-- Simplify order statuses to: new, confirmed, cancelled
UPDATE orders SET status = 'new'
WHERE status IN ('contacted', 'called_customer', 'waiting_confirmation');

UPDATE orders SET status = 'confirmed'
WHERE status IN ('packed', 'completed');

UPDATE order_logs SET status = 'new'
WHERE status IN ('contacted', 'called_customer', 'waiting_confirmation');

UPDATE order_logs SET status = 'confirmed'
WHERE status IN ('packed', 'completed');

-- Payment tracking for confirmed orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'not_received';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_remarks TEXT;

UPDATE orders SET payment_method = 'not_received' WHERE payment_method IS NULL;
