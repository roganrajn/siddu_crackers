import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload, inferContentType } from '../middleware/upload.js';
import { uploadToS3 } from '../config/s3.js';

const router = express.Router();

function parseBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function parseSortOrder(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

async function uploadBannerImage(file) {
  const contentType = inferContentType(file);
  return uploadToS3({ ...file, mimetype: contentType }, 'banners');
}

router.get('/', async (req, res) => {
  try {
    const { admin } = req.query;
    const query = admin === 'true'
      ? 'SELECT * FROM banners ORDER BY sort_order ASC'
      : 'SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, sort_order, is_active } = req.body;
    let image_url = null;
    if (req.file) image_url = await uploadBannerImage(req.file);

    const result = await pool.query(
      `INSERT INTO banners (title, subtitle, button_text, button_link, image_url, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title,
        subtitle || null,
        button_text || 'Shop Now',
        button_link || '#products',
        image_url,
        parseSortOrder(sort_order) ?? 0,
        parseBool(is_active) ?? true,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[banners] Create error:', error.message);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.put('/reorder/bulk', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      await pool.query('UPDATE banners SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, sort_order, is_active } = req.body;
    let image_url;
    if (req.file) image_url = await uploadBannerImage(req.file);

    const result = await pool.query(
      `UPDATE banners SET
        title = COALESCE($1, title), subtitle = COALESCE($2, subtitle),
        button_text = COALESCE($3, button_text), button_link = COALESCE($4, button_link),
        image_url = COALESCE($5, image_url), sort_order = COALESCE($6, sort_order),
        is_active = COALESCE($7, is_active), updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        title || null,
        subtitle ?? null,
        button_text || null,
        button_link || null,
        image_url ?? null,
        parseSortOrder(sort_order),
        parseBool(is_active),
        req.params.id,
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Banner not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[banners] Update error:', error.message);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = $1', [req.params.id]);
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
