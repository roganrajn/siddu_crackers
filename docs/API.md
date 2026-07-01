# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

### POST /auth/login

```json
{
  "email": "roganinnovater@gmail.com",
  "password": "Rogan@123"
}
```

Response:
```json
{
  "token": "jwt-token",
  "user": { "id": 1, "email": "roganinnovater@gmail.com" }
}
```

All admin endpoints require `Authorization: Bearer <token>` header.

## Categories

- `GET /categories` - Public list (visible only)
- `GET /categories?admin=true` - All categories (admin)
- `GET /categories/:slug` - Single category
- `POST /categories` - Create (multipart/form-data)
- `PUT /categories/:id` - Update
- `DELETE /categories/:id` - Delete or hide if has products
- `PUT /categories/reorder/bulk` - Reorder categories

## Products

- `GET /products` - Public list
- `GET /products?category=slug` - Filter by category
- `GET /products?search=term` - Search
- `GET /products?featured=true` - Featured products
- `GET /products?best_seller=true` - Best sellers
- `GET /products/:slug` - Single product
- `POST /products` - Create (multipart/form-data)
- `PUT /products/:id` - Update
- `DELETE /products/:id` - Delete
- `POST /products/:id/duplicate` - Duplicate product
- `PUT /products/reorder/bulk` - Reorder products

## Orders

- `POST /orders` - Create order (public)
- `GET /orders` - List orders (admin, paginated)
- `GET /orders/:id` - Order detail (admin)
- `PUT /orders/:id/status` - Update status (admin)
- `GET /orders/export/csv` - Export CSV (admin)

### Create Order Body

```json
{
  "customer_name": "John Doe",
  "phone": "8903327837",
  "whatsapp": "8903327837",
  "email": "john@example.com",
  "state": "Tamil Nadu",
  "city": "Chennai",
  "address": "123 Main St",
  "pincode": "600001",
  "remarks": "Deliver before Diwali",
  "items": [
    {
      "product_id": 1,
      "product_name": "4 Inch Lakshmi",
      "price": 100,
      "quantity": 2
    }
  ]
}
```

## Settings

- `GET /settings` - Public settings
- `PUT /settings` - Update settings (admin, multipart/form-data)

## Order Statuses

- `new` - Just placed
- `contacted` - Admin reached out
- `confirmed` - Order confirmed
- `completed` - Delivered
- `cancelled` - Cancelled
