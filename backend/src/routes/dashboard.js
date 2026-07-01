import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersToday, pending, completed, revenue, products, categories, recentOrders, statusBreakdown] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM orders WHERE created_at >= $1', [today]),
        pool.query("SELECT COUNT(*) FROM orders WHERE status IN ('new', 'contacted', 'confirmed', 'packed')"),
        pool.query("SELECT COUNT(*) FROM orders WHERE status = 'completed'"),
        pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'"),
        pool.query('SELECT COUNT(*) FROM products'),
        pool.query('SELECT COUNT(*) FROM categories'),
        pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'),
        pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status'),
      ]);

    const last7Days = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    res.json({
      ordersToday: parseInt(ordersToday.rows[0].count),
      pendingOrders: parseInt(pending.rows[0].count),
      completedOrders: parseInt(completed.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalProducts: parseInt(products.rows[0].count),
      totalCategories: parseInt(categories.rows[0].count),
      recentOrders: recentOrders.rows,
      statusBreakdown: statusBreakdown.rows,
      chartData: last7Days.rows,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
