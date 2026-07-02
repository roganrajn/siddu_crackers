import pool from '../config/db.js';
import { sendOrderEmails } from './email.service.js';

const VALID_STATUSES = ['new', 'confirmed', 'cancelled'];

const LEGACY_STATUS_ALIASES = {
  called_customer: 'new',
  waiting_confirmation: 'new',
  contacted: 'new',
  packed: 'confirmed',
  completed: 'confirmed',
};

const VALID_PAYMENT_METHODS = ['not_received', 'upi', 'bank_transfer', 'cash'];

export const CUSTOMER_STATUS_MAP = {
  new: 'Received',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  contacted: 'Received',
  called_customer: 'Received',
  waiting_confirmation: 'Received',
  packed: 'Confirmed',
  completed: 'Confirmed',
};

export function normalizeStatus(status) {
  return LEGACY_STATUS_ALIASES[status] || status;
}

export function resolvePaymentFields({ payment_method, payment_transaction_id, payment_remarks }) {
  let method = payment_method || 'not_received';
  let transactionId = payment_transaction_id?.trim() || null;
  let remarks = payment_remarks?.trim() || null;

  if (method === 'upi' || method === 'bank_transfer') {
    if (!transactionId) {
      method = 'not_received';
      transactionId = null;
      remarks = null;
    }
  } else if (method === 'cash') {
    transactionId = null;
  } else {
    method = 'not_received';
    transactionId = null;
    remarks = null;
  }

  return {
    payment_method: method,
    payment_transaction_id: transactionId,
    payment_remarks: remarks,
  };
}

/**
 * Generate sequential order number: SID202600001
 */
export async function generateOrderNumber(client, maxRetries = 5) {
  const year = new Date().getFullYear();
  const prefix = `SID${year}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await client.query(
      `SELECT order_number FROM orders
       WHERE order_number LIKE $1
       ORDER BY order_number DESC
       LIMIT 1
       FOR UPDATE`,
      [`${prefix}%`]
    );

    let sequence = 1;
    if (result.rows[0]) {
      const lastSeq = parseInt(result.rows[0].order_number.slice(prefix.length), 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    const orderNumber = `${prefix}${String(sequence).padStart(5, '0')}`;

    const exists = await client.query(
      'SELECT 1 FROM orders WHERE order_number = $1',
      [orderNumber]
    );
    if (!exists.rows.length) return orderNumber;
  }

  throw new Error('Failed to generate unique order number');
}

async function logOrderStatus(client, orderId, status, note = null) {
  await client.query(
    'INSERT INTO order_logs (order_id, status, note) VALUES ($1, $2, $3)',
    [orderId, status, note]
  );
}

async function createNotification(type, title, message, referenceId) {
  try {
    await pool.query(
      'INSERT INTO notifications (type, title, message, reference_id) VALUES ($1, $2, $3, $4)',
      [type, title, message, referenceId]
    );
  } catch (err) {
    console.error('[notification] Failed to create:', err.message);
  }
}

function validateOrderInput(body) {
  const { customer_name, phone, state, city, address, pincode, items } = body;
  const errors = [];

  if (!customer_name?.trim()) errors.push('Customer name is required');
  if (!phone?.trim()) errors.push('Phone is required');
  if (!state?.trim()) errors.push('State is required');
  if (!city?.trim()) errors.push('City is required');
  if (!address?.trim()) errors.push('Address is required');
  if (!pincode?.trim()) errors.push('Pincode is required');
  if (!items?.length) errors.push('Order must contain at least one item');

  for (const item of items || []) {
    if (!item.product_name) errors.push('Each item must have a product name');
    if (!item.quantity || item.quantity < 1) errors.push('Invalid quantity');
    if (item.price == null || item.price < 0) errors.push('Invalid price');
  }

  return errors;
}

/**
 * Create a new order with items in a single transaction.
 */
export async function createOrder(orderData) {
  const errors = validateOrderInput(orderData);
  if (errors.length) {
    const err = new Error(errors.join('. '));
    err.status = 400;
    throw err;
  }

  const {
    customer_name, phone, whatsapp, email, state, city, address, pincode, remarks, items,
  } = orderData;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderNumber = await generateOrderNumber(client);
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const subtotal = parseFloat(item.price) * parseInt(item.quantity, 10);
      totalAmount += subtotal;
      orderItems.push({ ...item, subtotal });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_name, phone, whatsapp, email, state, city, address, pincode, remarks, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new') RETURNING *`,
      [
        orderNumber,
        customer_name.trim(),
        phone.trim(),
        whatsapp?.trim() || phone.trim(),
        email?.trim() || null,
        state.trim(),
        city.trim(),
        address.trim(),
        pincode.trim(),
        remarks?.trim() || null,
        totalAmount,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
      );
    }

    await logOrderStatus(client, order.id, 'new', 'Order placed by customer');
    await client.query('COMMIT');

    // Post-commit actions — non-blocking, failures don't affect order
    sendOrderEmails(order, orderItems).catch((err) =>
      console.error('[order] Email dispatch error:', err.message)
    );

    createNotification(
      'order',
      `New Order #${orderNumber}`,
      `${customer_name} - ₹${totalAmount}`,
      order.id
    );

    return { order, items: orderItems };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrderStatus(orderId, status, note = null) {
  const normalized = normalizeStatus(status);
  if (!VALID_STATUSES.includes(normalized)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }

  const id = parseInt(orderId, 10);
  if (!id) {
    const err = new Error('Invalid order id');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE orders SET
        status = $1,
        payment_method = CASE
          WHEN $1 = 'confirmed' THEN COALESCE(payment_method, 'not_received')
          ELSE payment_method
        END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [normalized, id]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    await logOrderStatus(client, id, normalized, note || `Status changed to ${normalized}`);
    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrderPayment(orderId, paymentData) {
  const id = parseInt(orderId, 10);
  if (!id) {
    const err = new Error('Invalid order id');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    const order = existing.rows[0];
    const normalizedStatus = normalizeStatus(order.status);
    if (normalizedStatus !== 'confirmed') {
      const err = new Error('Payment can only be updated for confirmed orders');
      err.status = 400;
      throw err;
    }

    const method = paymentData.payment_method;
    if (method && !VALID_PAYMENT_METHODS.includes(method)) {
      const err = new Error('Invalid payment method');
      err.status = 400;
      throw err;
    }

    const payment = resolvePaymentFields({
      payment_method: method || order.payment_method,
      payment_transaction_id: paymentData.payment_transaction_id ?? order.payment_transaction_id,
      payment_remarks: paymentData.payment_remarks ?? order.payment_remarks,
    });

    const result = await client.query(
      `UPDATE orders SET
        payment_method = $1,
        payment_transaction_id = $2,
        payment_remarks = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [payment.payment_method, payment.payment_transaction_id, payment.payment_remarks, id]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

export { VALID_STATUSES, VALID_PAYMENT_METHODS };
