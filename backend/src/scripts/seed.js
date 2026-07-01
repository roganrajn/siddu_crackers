import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../../../database/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Schema created');

    const admins = [
      { email: 'roganinnovater@gmail.com', password: 'Rogan@123' },
      { email: 'sidducrackers@gmail.com', password: 'Siddu@123' },
    ];

    for (const admin of admins) {
      const hash = await bcrypt.hash(admin.password, 10);
      await pool.query(
        `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [admin.email, hash]
      );
    }
    console.log('✅ Admin users seeded');

    const seed = fs.readFileSync(path.join(__dirname, '../../../database/seed.sql'), 'utf8');
    const statements = seed.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await pool.query(stmt);
        } catch (e) {
          if (!e.message.includes('duplicate')) console.warn('Seed warning:', e.message);
        }
      }
    }
    console.log('✅ Seed data loaded');
    console.log('🎆 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
