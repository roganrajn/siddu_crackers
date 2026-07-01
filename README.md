# Siddu Crackers

A modern firecracker ordering website built with Vue 3 and Node.js. Customers browse products, add to cart, and place orders. Admin manages catalog and orders via a dashboard.

## Tech Stack

**Frontend:** Vue 3, Vite, Pinia, Vue Router, Axios, SCSS  
**Backend:** Node.js, Express, PostgreSQL, JWT, Nodemailer, Multer, AWS S3

## Project Structure

```
sidducrackers/
├── frontend/          # Vue 3 customer + admin UI
├── backend/           # Express REST API
├── database/          # PostgreSQL schema & seed
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
createdb siddu_crackers
psql siddu_crackers < database/schema.sql
psql siddu_crackers < database/seed.sql
```

Or use the seed script (creates schema + seeds admin with bcrypt hash):

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run seed
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET, SMTP, AWS S3
npm install
npm run dev
```

API runs at `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Default Admin Credentials

Two admin accounts are seeded (passwords stored as bcrypt hashes in `admin_users`):

| Email | Default password |
|-------|------------------|
| roganinnovater@gmail.com | Rogan@123 |
| sidducrackers@gmail.com | Siddu@123 |

> Change passwords after first login via **Admin → Settings → Admin Account**.

For existing databases, run: `psql siddu_crackers < database/migration_v4.sql`

## Features

### Customer
- Diwali-themed responsive UI
- Hero banner with fireworks animation
- Category browsing with sticky category bar
- Product cards with discount badges
- Instant search filtering
- Floating cart with slide-in drawer
- Checkout with customer details
- Order success with contact info
- WhatsApp floating button

### Admin
- JWT authentication
- Dashboard with stats
- Category CRUD (hide instead of delete if products exist)
- Product CRUD with image upload, duplicate, hide/show
- Order management with status updates
- CSV export
- Print order
- Website settings (logo, contact, social links)

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | Admin login |
| GET | /api/categories | No | List categories |
| POST | /api/categories | Yes | Create category |
| GET | /api/products | No | List products |
| POST | /api/products | Yes | Create product |
| POST | /api/orders | No | Place order |
| GET | /api/orders | Yes | List orders |
| GET | /api/settings | No | Get settings |
| PUT | /api/settings | Yes | Update settings |

## Environment Variables

See `backend/.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `SMTP_*` - Email configuration for order notifications
- `AWS_*` - S3 credentials for image uploads

## Order Flow

1. Customer adds products to cart (stored in localStorage)
2. Fills checkout form and submits
3. Backend saves order, generates order number (e.g., SID2026123456)
4. Admin receives HTML email notification
5. Admin contacts customer via phone/WhatsApp to confirm

## License

Private - Siddu Crackers
