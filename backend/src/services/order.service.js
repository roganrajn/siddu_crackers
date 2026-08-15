import pool from '../config/db.js';
import { sendOrderEmails } from './email.service.js';
import {
  calculateOrderBreakdown,
  calculateGst,
  roundMoney,
  normalizeOrderSettings,
  normalizeBoolean,
  resolveGstApplicableFromState,
} from '../utils/orderPricing.js';

const VALID_STATUSES = ['new', 'confirmed', 'paid', 'cancelled'];

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
  paid: 'Paid',
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

  if (method === 'not_received') {
    return {
      payment_method: 'not_received',
      payment_transaction_id: null,
      payment_remarks: null,
    };
  }

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

async function getOrderSettings(client) {
  const result = await client.query(
    `SELECT min_order_amount, order_packing_percentage, gst_enabled, gst_percentage, gst_number
     FROM website_settings ORDER BY id LIMIT 1`
  );
  return normalizeOrderSettings(result.rows[0] || {});
}

async function resolveOrderItems(client, items) {
  const resolved = [];

  for (const item of items) {
    const quantity = parseInt(item.quantity, 10);
    let mrpPrice = parseFloat(item.mrp_price ?? item.original_price);
    let offerPrice = parseFloat(item.price);

    if (item.product_id) {
      const productResult = await client.query(
        'SELECT original_price, offer_price, name FROM products WHERE id = $1',
        [item.product_id]
      );
      if (productResult.rows[0]) {
        mrpPrice = parseFloat(productResult.rows[0].original_price);
        offerPrice = parseFloat(productResult.rows[0].offer_price);
      }
    }

    if (!mrpPrice || mrpPrice < 0) mrpPrice = offerPrice;
    if (!offerPrice || offerPrice < 0) offerPrice = mrpPrice;

    resolved.push({
      product_id: item.product_id || null,
      product_name: item.product_name,
      mrp_price: mrpPrice,
      price: offerPrice,
      quantity,
      subtotal: Math.round(offerPrice * quantity * 100) / 100,
    });
  }

  return resolved;
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

    const orderSettings = await getOrderSettings(client);
    const orderItems = await resolveOrderItems(client, items);
    const gstApplicable = Boolean(
      orderSettings.gst_enabled
      && orderSettings.gst_percentage > 0
      && resolveGstApplicableFromState(state)
    );
    const breakdown = calculateOrderBreakdown(
      orderItems,
      { ...orderSettings, gst_applicable: gstApplicable },
      state
    );

    if (breakdown.net_amount < breakdown.min_order_amount) {
      const err = new Error(
        `Minimum order amount is ₹${breakdown.min_order_amount.toFixed(2)}. Your order total is ₹${breakdown.net_amount.toFixed(2)}.`
      );
      err.status = 400;
      throw err;
    }

    const orderNumber = await generateOrderNumber(client);

    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, customer_name, phone, whatsapp, email, state, city, address, pincode, remarks,
        total_amount, subtotal_mrp, discount_percentage, discount_amount, after_discount,
        special_discount_percentage, special_discount_amount, after_special_discount,
        packing_percentage, packing_amount, bill_type, gst_applicable, gst_percentage, gst_amount, gst_number, taxable_amount, net_amount, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'new'
      ) RETURNING *`,
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
        breakdown.net_amount,
        breakdown.subtotal_mrp,
        breakdown.discount_percentage,
        breakdown.discount_amount,
        breakdown.after_discount,
        breakdown.special_discount_percentage,
        breakdown.special_discount_amount,
        breakdown.after_special_discount,
        breakdown.packing_percentage,
        breakdown.packing_amount,
        breakdown.bill_type,
        breakdown.gst_applicable,
        breakdown.gst_percentage,
        breakdown.gst_amount,
        breakdown.gst_number,
        breakdown.taxable_amount,
        breakdown.net_amount,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, mrp_price, price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id, item.product_name, item.mrp_price, item.price, item.quantity, item.subtotal]
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
      `${customer_name} - ₹${breakdown.net_amount}`,
      order.id
    );

    return { order, items: orderItems, breakdown };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function parseGstFlag(payload = {}) {
  if (payload.gst_applicable === undefined || payload.gst_applicable === null || payload.gst_applicable === '') {
    return null;
  }
  return normalizeBoolean(payload.gst_applicable, false);
}

function buildGstUpdateFields(order, settings, gstFlag) {
  const afterDiscount = parseFloat(order.after_discount ?? 0);
  const packingAmount = parseFloat(order.packing_amount ?? 0);
  const afterPacking = roundMoney(afterDiscount + packingAmount);
  const gstPercentage = gstFlag ? parseFloat(settings.gst_percentage || 18) : 0;
  const gstAmount = gstFlag ? calculateGst(afterPacking, gstPercentage) : 0;
  const netAmount = roundMoney(afterPacking + gstAmount);

  return {
    gst_applicable: gstFlag,
    gst_percentage: gstPercentage,
    gst_amount: gstAmount,
    gst_number: gstFlag ? (settings.gst_number || order.gst_number) : order.gst_number,
    taxable_amount: gstFlag ? afterPacking : 0,
    net_amount: netAmount,
    total_amount: netAmount,
  };
}

/**
 * Update order status and/or GST on the same row.
 * Amounts follow gst_applicable: true adds GST %, false removes it.
 */
export async function updateOrderStatus(orderId, statusOrPayload, note = null) {
  const payload = (statusOrPayload && typeof statusOrPayload === 'object' && !Array.isArray(statusOrPayload))
    ? statusOrPayload
    : { status: statusOrPayload, note };

  const gstFlag = parseGstFlag(payload);
  const hasStatus = payload.status != null && String(payload.status).trim() !== '';
  const normalized = hasStatus ? normalizeStatus(payload.status) : null;

  if (hasStatus && !VALID_STATUSES.includes(normalized)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }

  if (!hasStatus && gstFlag == null) {
    const err = new Error('status is required');
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

    const existing = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      await client.query('ROLLBACK');
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    const order = existing.rows[0];
    const nextStatus = normalized || order.status;
    const updateGst = gstFlag != null;
    const gstFields = updateGst
      ? buildGstUpdateFields(order, await getOrderSettings(client), gstFlag)
      : null;

    let result;
    if (updateGst) {
      result = await client.query(
        `UPDATE orders SET
          status = $1::varchar,
          gst_applicable = $2,
          gst_percentage = $3,
          gst_amount = $4,
          gst_number = $5,
          taxable_amount = $6,
          net_amount = $7,
          total_amount = $7,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 RETURNING *`,
        [
          nextStatus,
          gstFlag,
          gstFields.gst_percentage,
          gstFields.gst_amount,
          gstFields.gst_number,
          gstFields.taxable_amount,
          gstFields.net_amount,
          id,
        ]
      );
    } else {
      result = await client.query(
        `UPDATE orders SET
          status = $1::varchar,
          payment_method = CASE
            WHEN $1::varchar = 'confirmed' AND $1::varchar IS DISTINCT FROM status THEN 'not_received'
            ELSE payment_method
          END,
          payment_transaction_id = CASE
            WHEN $1::varchar = 'confirmed' AND $1::varchar IS DISTINCT FROM status THEN NULL
            ELSE payment_transaction_id
          END,
          payment_remarks = CASE
            WHEN $1::varchar = 'confirmed' AND $1::varchar IS DISTINCT FROM status THEN NULL
            ELSE payment_remarks
          END,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        [nextStatus, id]
      );
    }

    const logNote = updateGst
      ? `GST ${gstFlag ? 'enabled' : 'disabled'}, net ₹${gstFields.net_amount}`
      : (payload.note || note || `Status changed to ${nextStatus}`);

    await logOrderStatus(client, id, nextStatus, logNote);
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

export async function updateOrderGst(orderId, gstApplicable) {
  return updateOrderStatus(orderId, { gst_applicable: gstApplicable });
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
    if (!['confirmed', 'paid'].includes(normalizedStatus)) {
      const err = new Error('Payment can only be updated for confirmed or paid orders');
      err.status = 400;
      throw err;
    }

    const method = paymentData.payment_method;
    if (method && !VALID_PAYMENT_METHODS.includes(method)) {
      const err = new Error('Invalid payment method');
      err.status = 400;
      throw err;
    }

    if (method === 'not_received') {
      const result = await client.query(
        `UPDATE orders SET
          payment_method = 'not_received',
          payment_transaction_id = NULL,
          payment_remarks = NULL,
          status = 'confirmed',
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [id]
      );

      await logOrderStatus(client, id, 'confirmed', 'Payment marked as not received');
      await client.query('COMMIT');
      return result.rows[0];
    }

    const payment = resolvePaymentFields({
      payment_method: method || order.payment_method,
      payment_transaction_id: paymentData.payment_transaction_id ?? order.payment_transaction_id,
      payment_remarks: paymentData.payment_remarks ?? order.payment_remarks,
    });

    if (payment.payment_method === 'not_received') {
      const err = new Error('Transaction ID is required for UPI and Bank Transfer');
      err.status = 400;
      throw err;
    }

    const result = await client.query(
      `UPDATE orders SET
        payment_method = $1,
        payment_transaction_id = $2,
        payment_remarks = $3,
        status = 'paid',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [payment.payment_method, payment.payment_transaction_id, payment.payment_remarks, id]
    );

    await logOrderStatus(
      client,
      id,
      'paid',
      `Payment received via ${payment.payment_method}`
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
