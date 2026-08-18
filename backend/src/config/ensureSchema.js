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
    ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS order_gst_percentage DECIMAL(5, 2) DEFAULT 18;
  `);

  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT false;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;
  `);

  await pool.query(`
    UPDATE website_settings SET order_gst_percentage = 18 WHERE order_gst_percentage IS NULL;
    UPDATE orders SET gst_enabled = COALESCE(gst_enabled, false);
    UPDATE orders SET gst_percentage = COALESCE(gst_percentage, 0);
    UPDATE orders SET gst_amount = COALESCE(gst_amount, 0);
  `);

  try {
    const triggers = await pool.query(`
      SELECT t.tgname, pg_get_functiondef(t.tgfoid) AS def
      FROM pg_trigger t
      WHERE t.tgrelid = 'orders'::regclass
        AND NOT t.tgisinternal
    `);
    for (const row of triggers.rows) {
      const blob = `${row.tgname} ${row.def || ''}`;
      if (!/gst|bill_type|taxable/i.test(blob)) continue;
      const quoted = await pool.query('SELECT quote_ident($1) AS ident', [row.tgname]);
      await pool.query(`DROP TRIGGER IF EXISTS ${quoted.rows[0].ident} ON orders`);
      console.log(`[db] Dropped order trigger ${row.tgname}`);
    }
  } catch (error) {
    console.error('[db] Could not inspect order triggers:', error.message);
  }

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

  console.log('[db] Schema check complete');
}
