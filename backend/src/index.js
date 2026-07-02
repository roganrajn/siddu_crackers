import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { verifySmtpConnection } from './services/email.service.js';
import { isS3Configured, listS3Objects } from './config/s3.js';
import { ensureSchema } from './config/ensureSchema.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import settingsRoutes from './routes/settings.js';
import bannerRoutes from './routes/banners.js';
import reviewRoutes from './routes/reviews.js';
import dashboardRoutes from './routes/dashboard.js';
import imageRoutes from './routes/images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'https://sidducrackers.in',
  'https://app.sidducrackers.in',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Siddu Crackers API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/images', imageRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 10MB.'
      : err.message;
    return res.status(400).json({ error: message });
  }
  if (err.message?.includes('Unsupported file type') || err.message?.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`🎆 Siddu Crackers API running on port ${PORT}`);
  try {
    await ensureSchema();
  } catch (e) {
    console.error('[db] Schema ensure failed:', e.message);
  }
  verifySmtpConnection();
  if (isS3Configured()) {
    listS3Objects({ maxKeys: 1 })
      .then((r) => console.log(`[s3] Connected — bucket: ${r.bucket}, folder: ${r.rootFolder}/`))
      .catch((e) => console.error('[s3] Connection failed:', e.message));
  } else {
    console.warn('[s3] Not configured — image uploads will fail');
  }
});

export default app;
