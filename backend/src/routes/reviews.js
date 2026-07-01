import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { admin } = req.query;
    const query = admin === 'true'
      ? 'SELECT * FROM reviews ORDER BY sort_order ASC, created_at DESC'
      : 'SELECT * FROM reviews WHERE is_visible = true ORDER BY sort_order ASC, created_at DESC LIMIT 10';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { customer_name, rating, comment, is_visible, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO reviews (customer_name, rating, comment, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customer_name, rating, comment, is_visible !== false, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { customer_name, rating, comment, is_visible, sort_order } = req.body;
    const result = await pool.query(
      `UPDATE reviews SET
        customer_name = COALESCE($1, customer_name), rating = COALESCE($2, rating),
        comment = COALESCE($3, comment), is_visible = COALESCE($4, is_visible),
        sort_order = COALESCE($5, sort_order)
       WHERE id = $6 RETURNING *`,
      [customer_name, rating, comment, is_visible, sort_order, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  res.json({ message: 'Review deleted' });
});

export default router;
