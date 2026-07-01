import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadToS3 } from '../config/s3.js';
import { slugify } from '../utils/helpers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { admin } = req.query;
    const query = admin === 'true'
      ? 'SELECT * FROM categories ORDER BY sort_order ASC'
      : 'SELECT * FROM categories WHERE is_visible = true ORDER BY sort_order ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/reorder/bulk', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      await pool.query('UPDATE categories SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, upload.single('banner_image'), async (req, res) => {
  try {
    const { name, sort_order, is_visible, icon, color } = req.body;
    const slug = slugify(name);
    let banner_image = null;
    if (req.file) banner_image = await uploadToS3(req.file, 'banners');

    const result = await pool.query(
      `INSERT INTO categories (name, slug, banner_image, icon, color, sort_order, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, slug, banner_image, icon || '🎇', color || '#ff6b00', sort_order || 0, is_visible !== 'false']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Category already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, upload.single('banner_image'), async (req, res) => {
  try {
    const { name, sort_order, is_visible, icon, color } = req.body;
    const slug = name ? slugify(name) : undefined;
    let banner_image = req.body.banner_image;
    if (req.file) banner_image = await uploadToS3(req.file, 'banners');

    const result = await pool.query(
      `UPDATE categories SET
        name = COALESCE($1, name), slug = COALESCE($2, slug),
        banner_image = COALESCE($3, banner_image),
        icon = COALESCE($4, icon), color = COALESCE($5, color),
        sort_order = COALESCE($6, sort_order),
        is_visible = COALESCE($7, is_visible),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, slug, banner_image, icon, color, sort_order, is_visible, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const productCheck = await pool.query(
      'SELECT COUNT(*) FROM product_categories WHERE category_id = $1', [req.params.id]
    );
    if (parseInt(productCheck.rows[0].count) > 0) {
      await pool.query('UPDATE categories SET is_visible = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Category hidden (has products)', hidden: true });
    }
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
