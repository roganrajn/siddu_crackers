-- Migration v3: Order workflow enhancements
-- psql siddu_crackers < database/migration_v3.sql

ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS confirmation_time VARCHAR(100) DEFAULT 'Within 2 hours';

-- Normalize legacy order statuses to new workflow
UPDATE orders SET status = 'contacted' WHERE status IN ('called_customer', 'waiting_confirmation');

-- Business contact numbers (Siddu Crackers)
UPDATE website_settings
SET phone = '+91 89033 27837', whatsapp = '+91 89033 27837'
WHERE phone = '+91 98765 43210' OR whatsapp = '+91 98765 43210';
