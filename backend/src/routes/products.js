import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadToS3 } from '../config/s3.js';
import { slugify, calculateDiscount } from '../utils/helpers.js';

const router = express.Router();

const VALID_STATUSES = ['new', 'called_customer', 'waiting_confirmation', 'confirmed', 'packed', 'completed', 'cancelled'];

const attachImages = async (products) => {
  if (!products.length) return products;
  const ids = products.map(p => p.id);
  const images = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order ASC',
    [ids]
  );
  const imageMap = {};
  images.rows.forEach(img => {
    if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
    imageMap[img.product_id].push(img);
  });
  return products.map(p => ({ ...p, images: imageMap[p.id] || [] }));
};

const getProductsQuery = (whereClause = '', params = [], orderBy = 'p.sort_order ASC, p.created_at DESC') => {
  return pool.query(
    `SELECT p.*,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon, 'color', c.color))
        FILTER (WHERE c.id IS NOT NULL), '[]'
      ) as categories
     FROM products p
     LEFT JOIN product_categories pc ON p.id = pc.product_id
     LEFT JOIN categories c ON pc.category_id = c.id
     ${whereClause}
     GROUP BY p.id
     ORDER BY ${orderBy}`,
    params
  );
};

router.get('/search/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const result = await pool.query(
      `SELECT id, name, slug, offer_price, image_url, sku
       FROM products WHERE is_visible = true AND (name ILIKE $1 OR sku ILIKE $1)
       ORDER BY name ASC LIMIT 8`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      admin, category, category_id, search, featured, best_seller, tag,
      min_price, max_price, sort_by, sort_dir, page = 1, limit,
    } = req.query;

    const isAdmin = admin === 'true';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = parseInt(limit, 10) || (isAdmin ? 10 : 100);

    let where = [];
    let params = [];
    let paramIndex = 1;

    if (!isAdmin) where.push('p.is_visible = true');
    if (category_id) {
      where.push(`c.id = $${paramIndex++}`);
      params.push(parseInt(category_id, 10));
    } else if (category) {
      where.push(`c.slug = $${paramIndex++}`);
      params.push(category);
    }
    if (search) {
      where.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (featured === 'true') where.push('p.is_featured = true');
    if (best_seller === 'true') where.push('p.is_best_seller = true');
    if (tag) {
      where.push(`$${paramIndex++} = ANY(p.tags)`);
      params.push(tag);
    }
    if (min_price) {
      where.push(`p.offer_price >= $${paramIndex++}`);
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      where.push(`p.offer_price <= $${paramIndex++}`);
      params.push(parseFloat(max_price));
    }

    const sortMap = {
      name: 'p.name',
      price: 'p.offer_price',
      discount: 'p.discount_percentage',
      updated: 'p.updated_at',
      created: 'p.created_at',
    };
    const orderCol = sortMap[sort_by] || (isAdmin ? 'p.created_at' : 'p.sort_order');
    const direction = sort_dir === 'asc' && !sort_by && !isAdmin ? 'ASC' : (sort_dir === 'desc' || (isAdmin && !sort_by) ? 'DESC' : 'ASC');
    const orderBy = `${orderCol} ${direction}${orderCol !== 'p.sort_order' ? ', p.sort_order ASC' : ''}`;

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const fromJoin = `FROM products p
     LEFT JOIN product_categories pc ON p.id = pc.product_id
     LEFT JOIN categories c ON pc.category_id = c.id`;

    if (isAdmin) {
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT p.id) ${fromJoin} ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);
      const offset = (pageNum - 1) * pageLimit;

      const result = await pool.query(
        `SELECT p.*,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon, 'color', c.color))
            FILTER (WHERE c.id IS NOT NULL), '[]'
          ) as categories
         ${fromJoin}
         ${whereClause}
         GROUP BY p.id
         ORDER BY ${orderBy}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pageLimit, offset]
      );

      const withImages = await attachImages(result.rows);
      return res.json({
        products: withImages,
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / pageLimit)),
      });
    }

    const result = await getProductsQuery(whereClause, params, orderBy);
    const withImages = await attachImages(result.rows);
    res.json(withImages);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    if (req.params.slug === 'search') return res.status(404).json({ error: 'Not found' });
    const result = await getProductsQuery('WHERE p.slug = $1', [req.params.slug]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    const [product] = await attachImages([result.rows[0]]);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/reorder/bulk', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      await pool.query('UPDATE products SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      name, description, original_price, offer_price, sku,
      is_featured, is_best_seller, is_visible, sort_order, category_ids, tags,
    } = req.body;

    if (!name?.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (original_price == null || original_price === '' || offer_price == null || offer_price === '') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Original price and offer price are required' });
    }

    const slug = slugify(name);
    const discount = calculateDiscount(parseFloat(original_price), parseFloat(offer_price));
    const skuValue = sku?.trim() || null;
    let image_url = null;
    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    if (req.files?.image?.[0]) {
      image_url = await uploadToS3(req.files.image[0], 'products');
    }

    const result = await client.query(
      `INSERT INTO products (name, slug, description, original_price, offer_price, discount_percentage, image_url, sku, tags, is_featured, is_best_seller, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [name.trim(), slug, description, original_price, offer_price, discount, image_url, skuValue,
       parsedTags, is_featured === 'true', is_best_seller === 'true', is_visible !== 'false', sort_order || 0]
    );

    const product = result.rows[0];
    const cats = typeof category_ids === 'string' ? JSON.parse(category_ids) : category_ids;
    if (cats?.length) {
      for (const catId of cats) {
        await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)', [product.id, catId]);
      }
    }

    if (req.files?.images) {
      for (let i = 0; i < req.files.images.length; i++) {
        const url = await uploadToS3(req.files.images[i], 'products');
        await client.query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [product.id, url, i]
        );
        if (!image_url && i === 0) {
          await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [url, product.id]);
        }
      }
    }

    await client.query('COMMIT');
    const full = await getProductsQuery('WHERE p.id = $1', [product.id]);
    const [withImages] = await attachImages(full.rows);
    res.status(201).json(withImages);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      const field = error.detail?.includes('sku') ? 'SKU' : 'product name';
      return res.status(400).json({ error: `A product with this ${field} already exists` });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      name, description, original_price, offer_price, sku,
      is_featured, is_best_seller, is_visible, sort_order, category_ids, tags,
      remove_image_ids,
    } = req.body;

    const slug = name ? slugify(name) : undefined;
    const discount = original_price && offer_price
      ? calculateDiscount(parseFloat(original_price), parseFloat(offer_price))
      : undefined;
    let image_url = req.body.image_url;
    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined;
    const skuValue = sku !== undefined ? (sku?.trim() || null) : undefined;

    if (req.files?.image?.[0]) {
      image_url = await uploadToS3(req.files.image[0], 'products');
    }

    const result = await client.query(
      `UPDATE products SET
        name = COALESCE($1, name), slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        original_price = COALESCE($4, original_price),
        offer_price = COALESCE($5, offer_price),
        discount_percentage = COALESCE($6, discount_percentage),
        image_url = COALESCE($7, image_url), sku = COALESCE($8, sku),
        tags = COALESCE($9, tags),
        is_featured = COALESCE($10, is_featured),
        is_best_seller = COALESCE($11, is_best_seller),
        is_visible = COALESCE($12, is_visible),
        sort_order = COALESCE($13, sort_order),
        price_updated_at = CASE WHEN $4 IS NOT NULL OR $5 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE price_updated_at END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [name, slug, description, original_price, offer_price, discount, image_url, skuValue,
       parsedTags, is_featured, is_best_seller, is_visible, sort_order, req.params.id]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    if (category_ids) {
      const cats = typeof category_ids === 'string' ? JSON.parse(category_ids) : category_ids;
      await client.query('DELETE FROM product_categories WHERE product_id = $1', [req.params.id]);
      for (const catId of cats) {
        await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)', [req.params.id, catId]);
      }
    }

    if (remove_image_ids) {
      const ids = typeof remove_image_ids === 'string' ? JSON.parse(remove_image_ids) : remove_image_ids;
      if (ids.length) await client.query('DELETE FROM product_images WHERE id = ANY($1)', [ids]);
    }

    if (req.files?.images) {
      const countResult = await client.query('SELECT COUNT(*) FROM product_images WHERE product_id = $1', [req.params.id]);
      let startOrder = parseInt(countResult.rows[0].count);
      for (let i = 0; i < req.files.images.length; i++) {
        const url = await uploadToS3(req.files.images[i], 'products');
        await client.query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [req.params.id, url, startOrder + i]
        );
      }
    }

    await client.query('COMMIT');
    const full = await getProductsQuery('WHERE p.id = $1', [req.params.id]);
    const [withImages] = await attachImages(full.rows);
    res.json(withImages);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ message: 'Product deleted' });
});

router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const original = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!original.rows[0]) return res.status(404).json({ error: 'Product not found' });

    const p = original.rows[0];
    const newName = `${p.name} (Copy)`;
    const newSlug = slugify(newName) + '-' + Date.now();
    const newSku = p.sku ? `${p.sku}-COPY-${Date.now()}` : null;

    const result = await client.query(
      `INSERT INTO products (name, slug, description, original_price, offer_price, discount_percentage, image_url, sku, tags, is_featured, is_best_seller, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [newName, newSlug, p.description, p.original_price, p.offer_price, p.discount_percentage,
       p.image_url, newSku, p.tags || [], false, false, false, p.sort_order]
    );

    const cats = await client.query('SELECT category_id FROM product_categories WHERE product_id = $1', [req.params.id]);
    for (const cat of cats.rows) {
      await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)', [result.rows[0].id, cat.category_id]);
    }

    const imgs = await client.query('SELECT image_url, alt_text, sort_order FROM product_images WHERE product_id = $1', [req.params.id]);
    for (const img of imgs.rows) {
      await client.query(
        'INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES ($1, $2, $3, $4)',
        [result.rows[0].id, img.image_url, img.alt_text, img.sort_order]
      );
    }

    await client.query('COMMIT');
    const full = await getProductsQuery('WHERE p.id = $1', [result.rows[0].id]);
    const [withImages] = await attachImages(full.rows);
    res.status(201).json(withImages);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
