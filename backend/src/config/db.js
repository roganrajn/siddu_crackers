import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
