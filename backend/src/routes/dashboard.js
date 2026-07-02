import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

function buildDateFilter(date_from, date_to, startIndex = 1) {
  const parts = [];
  const params = [];
  let i = startIndex;

  if (date_from) {
    parts.push(`created_at >= $${i++}::date`);
    params.push(date_from);
  }
  if (date_to) {
    parts.push(`created_at < ($${i++}::date + INTERVAL '1 day')`);
    params.push(date_to);
  }

  return {
    where: parts.length ? `WHERE ${parts.join(' AND ')}` : '',
    and: parts.length ? `AND ${parts.join(' AND ')}` : '',
    params,
    nextIndex: i,
  };
}

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const hasDateFilter = Boolean(date_from || date_to);
    const dateFilter = buildDateFilter(date_from, date_to);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let orderCountQuery;
    let orderCountParams;

    if (hasDateFilter) {
      orderCountQuery = `SELECT COUNT(*) FROM orders ${dateFilter.where}`;
      orderCountParams = dateFilter.params;
    } else {
      orderCountQuery = 'SELECT COUNT(*) FROM orders WHERE created_at >= $1';
      orderCountParams = [today];
    }

    const pendingWhere = `WHERE status = 'new' ${dateFilter.and}`.replace('WHERE  ', 'WHERE ');
    const confirmedWhere = `WHERE status = 'confirmed' ${dateFilter.and}`.replace('WHERE  ', 'WHERE ');
    const revenueWhere = `WHERE status != 'cancelled' ${dateFilter.and}`.replace('WHERE  ', 'WHERE ');

    const [ordersInPeriod, pending, completed, revenue, products, categories, recentOrders, statusBreakdown] =
      await Promise.all([
        pool.query(orderCountQuery, orderCountParams),
        pool.query(`SELECT COUNT(*) FROM orders ${pendingWhere}`, dateFilter.params),
        pool.query(`SELECT COUNT(*) FROM orders ${confirmedWhere}`, dateFilter.params),
        pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders ${revenueWhere}`, dateFilter.params),
        pool.query('SELECT COUNT(*) FROM products'),
        pool.query('SELECT COUNT(*) FROM categories'),
        pool.query(
          `SELECT * FROM orders ${dateFilter.where} ORDER BY created_at DESC LIMIT 5`,
          dateFilter.params
        ),
        pool.query(
          `SELECT status, COUNT(*) as count FROM orders ${dateFilter.where} GROUP BY status`,
          dateFilter.params
        ),
      ]);

    let chartQuery;
    let chartParams;

    if (hasDateFilter) {
      chartQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue
        FROM orders ${dateFilter.where}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `;
      chartParams = dateFilter.params;
    } else {
      chartQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date ASC
      `;
      chartParams = [];
    }

    const chartResult = await pool.query(chartQuery, chartParams);

    res.json({
      ordersToday: parseInt(ordersInPeriod.rows[0].count, 10),
      pendingOrders: parseInt(pending.rows[0].count, 10),
      completedOrders: parseInt(completed.rows[0].count, 10),
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalProducts: parseInt(products.rows[0].count, 10),
      totalCategories: parseInt(categories.rows[0].count, 10),
      recentOrders: recentOrders.rows,
      statusBreakdown: statusBreakdown.rows,
      chartData: chartResult.rows,
      hasDateFilter,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
