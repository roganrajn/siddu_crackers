import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { isS3Configured, listS3Objects, deleteS3ObjectByKey } from '../config/s3.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!isS3Configured()) {
      return res.status(503).json({
        error: 'S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in backend/.env',
      });
    }

    const { folder } = req.query;
    const data = await listS3Objects({ subfolder: folder || '' });

    const folders = [...new Set(data.items.map((i) => i.folder))].sort();

    res.json({
      ...data,
      folders,
    });
  } catch (error) {
    console.error('[s3] List images error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to list S3 images' });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    if (!isS3Configured()) {
      return res.status(503).json({ error: 'S3 is not configured' });
    }

    const key = req.body?.key || req.query?.key;
    if (!key) {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    await deleteS3ObjectByKey(key);
    res.json({ message: 'Image deleted from S3', key });
  } catch (error) {
    console.error('[s3] Delete image error:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Failed to delete image' });
  }
});

export default router;
