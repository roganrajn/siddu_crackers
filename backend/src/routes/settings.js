import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadToS3 } from '../config/s3.js';
import { isSuperAdmin } from '../constants/admin.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM website_settings ORDER BY id LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    const canEditTheme = isSuperAdmin(req.user);
    const themeFields = ['primary_color', 'secondary_color', 'accent_color'];
    const fields = [
      'company_name', 'phone', 'email', 'whatsapp', 'address', 'footer_text',
      'copyright_text', 'offer_banner', 'confirmation_time',
      ...(canEditTheme ? themeFields : []),
      'google_map_embed', 'meta_title', 'meta_description',
      'google_analytics_id', 'facebook_pixel_id',
      'facebook', 'instagram', 'youtube',
      'min_order_amount', 'order_packing_percentage', 'order_gst_percentage', 'gst_percentage',
    ];

    let logo = req.body.logo;
    if (req.file) logo = await uploadToS3(req.file, 'logo');

    const existing = await pool.query('SELECT id FROM website_settings LIMIT 1');
    const values = fields.map(f => req.body[f] ?? null);
    values.push(logo);

    let result;
    if (existing.rows[0]) {
      const setClauses = fields.map((f, i) => `${f} = COALESCE($${i + 1}, ${f})`).join(', ');
      result = await pool.query(
        `UPDATE website_settings SET ${setClauses}, logo = COALESCE($${fields.length + 1}, logo), updated_at = CURRENT_TIMESTAMP
         WHERE id = $${fields.length + 2} RETURNING *`,
        [...values, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO website_settings (${fields.join(', ')}, logo)
         VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')}, $${fields.length + 1}) RETURNING *`,
        values
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
