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

  console.log('[db] Schema check complete');
}
