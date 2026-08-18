import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  updateOrderGst,
  CUSTOMER_STATUS_MAP,
  normalizeStatus,
} from '../services/order.service.js';
import { buildOrderDateFilter } from '../utils/dateFilter.js';

const router = express.Router();

function buildOrderFilters(query) {
  const { status, search, since, date_from, date_to } = query;
  const where = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    where.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (search) {
    where.push(`(order_number ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (since) {
    where.push(`created_at > $${paramIndex++}`);
    params.push(new Date(since).toISOString());
  }

  const dateFilter = buildOrderDateFilter(date_from, date_to, paramIndex);
  if (dateFilter.sql) {
    where.push(dateFilter.sql);
    params.push(...dateFilter.params);
    paramIndex = dateFilter.nextIndex;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereClause, params, paramIndex };
}

router.post('/', async (req, res) => {
  try {
    const result = await createOrder(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/track', async (req, res) => {
  try {
    const { order_number, phone } = req.body;
    if (!order_number || !phone) {
      return res.status(400).json({ error: 'Order number and phone are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const result = await pool.query(
      `SELECT o.*,
        COALESCE(
          json_agg(json_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'mrp_price', COALESCE(oi.mrp_price, oi.price),
            'subtotal', oi.subtotal
          ))
          FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.order_number = $1 AND RIGHT(REGEXP_REPLACE(o.phone, '[^0-9]', '', 'g'), 10) = $2
       GROUP BY o.id`,
      [order_number.toUpperCase(), cleanPhone]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Order not found. Please check your order number and phone.' });
    }

    const order = result.rows[0];
    const logs = await pool.query(
      'SELECT status, note, created_at FROM order_logs WHERE order_id = $1 ORDER BY created_at ASC',
      [order.id]
    );

    res.json({
      order: {
        order_number: order.order_number,
        customer_name: order.customer_name,
        total_amount: order.net_amount || order.total_amount,
        subtotal_mrp: order.subtotal_mrp,
        discount_percentage: order.discount_percentage,
        discount_amount: order.discount_amount,
        after_discount: order.after_discount,
        special_discount_percentage: order.special_discount_percentage,
        special_discount_amount: order.special_discount_amount,
        after_special_discount: order.after_special_discount,
        packing_percentage: order.packing_percentage,
        packing_amount: order.packing_amount,
        net_amount: order.net_amount,
        status: normalizeStatus(order.status),
        customer_status: CUSTOMER_STATUS_MAP[order.status] || CUSTOMER_STATUS_MAP[normalizeStatus(order.status)] || order.status,
        created_at: order.created_at,
        items: order.items,
      },
      timeline: logs.rows.map((l) => ({
        status: l.status,
        customer_status: CUSTOMER_STATUS_MAP[l.status] || l.status,
        note: l.note,
        date: l.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const { whereClause, params } = buildOrderFilters(req.query);
    const result = await pool.query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC`,
      params
    );
    const headers = 'Order Number,Customer Name,Phone,WhatsApp,Email,State,City,Address,Pincode,Total,Status,Date\n';
    const rows = result.rows.map((o) =>
      `"${o.order_number}","${o.customer_name}","${o.phone}","${o.whatsapp || ''}","${o.email || ''}","${o.state}","${o.city}","${o.address.replace(/"/g, '""')}","${o.pincode}",${o.total_amount},"${o.status}","${new Date(o.created_at).toLocaleString('en-IN')}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(headers + rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/gst/:id', authMiddleware, async (req, res) => {
  try {
    const order = await updateOrderGst(req.params.id, req.body?.gst_enabled);
    res.json(order);
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    console.error('Update order GST error:', error.message, error.code || '');
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { whereClause, params, paramIndex } = buildOrderFilters(req.query);
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const countResult = await pool.query(`SELECT COUNT(*) FROM orders ${whereClause}`, params);
    const result = await pool.query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / parseInt(limit, 10)),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!orderResult.rows[0]) return res.status(404).json({ error: 'Order not found' });

    const [itemsResult, logsResult] = await Promise.all([
      pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]),
      pool.query('SELECT * FROM order_logs WHERE order_id = $1 ORDER BY created_at ASC', [req.params.id]),
    ]);

    res.json({ order: orderResult.rows[0], items: itemsResult.rows, logs: logsResult.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const order = await updateOrderPayment(req.params.id, req.body);
    res.json(order);
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    console.error('Update order payment error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/gst', authMiddleware, async (req, res) => {
  try {
    const order = await updateOrderGst(req.params.id, req.body?.gst_enabled);
    res.json(order);
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    console.error('Update order GST error:', error.message, error.code || '');
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    console.log('[gst] PUT /status', req.params.id, {
      status: req.body?.status,
      gst_enabled: req.body?.gst_enabled,
    });
    const order = await updateOrderStatus(req.params.id, {
      status: req.body?.status,
      note: req.body?.note,
      gst_enabled: req.body?.gst_enabled,
    });
    res.json({ ...order, gst_code: 'gst-v4' });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    console.error('Update order status error:', error.message, error.code || '');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
