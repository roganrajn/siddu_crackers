# Deployment Guide

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production PostgreSQL
- [ ] Set up AWS S3 bucket with public read policy
- [ ] Configure SMTP for order emails
- [ ] Update `FRONTEND_URL` for CORS
- [ ] Enable HTTPS
- [ ] Change default admin password after first login

## Backend Deployment

```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

Recommended: PM2, Docker, or Railway/Render.

### Docker Example

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

## Frontend Deployment

```bash
cd frontend
npm install
npm run build
```

Deploy `dist/` folder to Vercel, Netlify, or S3 + CloudFront.

Set `VITE_API_URL` to your production API URL before building.

## Database Migration

```bash
psql $DATABASE_URL < database/schema.sql
cd backend && npm run seed
```

## S3 Bucket Policy

All uploads are stored under `siddu_crackers/` inside your bucket (e.g. `codetomillion`).

Set `AWS_S3_BUCKET`, `AWS_S3_FOLDER=siddu_crackers`, `AWS_REGION`, and credentials in `backend/.env`.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::codetomillion/siddu_crackers/*"
  }]
}
```

Upload paths:
- `siddu_crackers/products/` — product images
- `siddu_crackers/banners/` — hero banners & category banners
- `siddu_crackers/logo/` — site logo

Verify uploads in **Admin → Images** (lists all files from S3).

## Email Setup (Gmail)

1. Enable 2FA on Gmail account
2. Generate App Password
3. Set `SMTP_USER` and `SMTP_PASS` in `.env`
