import pool from './db.js';

/**
 * Apply safe, idempotent schema updates on startup so production stays in sync with code.
 */
export async function ensureSchema() {
  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'not_received';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_remarks TEXT;
  `);

  await pool.query(`
    UPDATE orders SET payment_method = 'not_received' WHERE payment_method IS NULL;
  `);

  await pool.query(`
    UPDATE orders SET status = 'new'
    WHERE status IN ('contacted', 'called_customer', 'waiting_confirmation');
  `);

  await pool.query(`
    UPDATE orders SET status = 'confirmed'
    WHERE status IN ('packed', 'completed');
  `);

  await pool.query(`
    UPDATE orders SET status = 'paid'
    WHERE status = 'confirmed'
      AND payment_method IN ('upi', 'bank_transfer', 'cash')
      AND (
        payment_method = 'cash'
        OR NULLIF(TRIM(payment_transaction_id), '') IS NOT NULL
      );
  `);

  await pool.query(`
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10, 2) DEFAULT 5000;
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_discount_percentage DECIMAL(5, 2) DEFAULT 70;
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_special_discount_percentage DECIMAL(5, 2) DEFAULT 15;
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_packing_percentage DECIMAL(5, 2) DEFAULT 5;
  `);

  await pool.query(`
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
  `);

  await pool.query(`
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT true;
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 18;
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50) DEFAULT '33ABAFD1628C1Z6';
  `);

  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_type VARCHAR(20) DEFAULT 'without_gst';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_applicable BOOLEAN DEFAULT false;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(10, 2);
  `);

  await pool.query(`
    UPDATE orders SET gst_applicable = false WHERE gst_applicable IS NULL;
  `);

  await pool.query(`
    UPDATE orders SET bill_type = CASE
      WHEN gst_applicable = true THEN 'with_gst'
      ELSE 'without_gst'
    END
    WHERE bill_type IS NULL OR bill_type = '';
  `);

  console.log('[db] Schema check complete');
}
