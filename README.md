# GreenGrove Market

Modern grocery and gardening services platform. Frontend is static HTML/CSS/JS; a lightweight Node/Express API connects to a MySQL database.

## Contents
- Overview
- Features
- Architecture
- Requirements
- Setup
- Environment Variables
- Running (Dev)
- API Overview
- Frontend Integration (pages)
- Database Expectations
- Troubleshooting
- Roadmap

---

## Overview
GreenGrove Market offers fresh groceries, gardening services, bookings, and a customer dashboard. The frontend is mobile-first and accessible; the backend provides REST endpoints for products, orders, payments, services, and bookings. Logging is captured client-side and relayed to the backend.

## Features
- Product catalog with live search (API-driven)
- Shopping cart (client-side) and server-side checkout (transactional orders + stock validation)
- Payments (pending records; ready for provider webhook integration)
- Gardening services and booking flow
- Customer dashboard showing recent orders and bookings
- Accessibility: ARIA-friendly notifications, reduced-motion handling
- Logging with offline retry and backend relay

## Architecture
- Frontend: Static HTML/CSS with Tailwind build (pages/), JavaScript in js/main.js
- Backend: Node.js + Express (server/index.js)
- DB: MySQL (connection via .env); transactional operations for orders/stock
- Build tools: Tailwind CSS, live-server, concurrently

Directory highlights:
- pages/ homepage.html, product_marketplace.html, garden_services_hub.html, customer_dashboard.html
- js/ main.js (cart, search, forms, notifications, logging)
- server/ index.js (API endpoints and MySQL pool)
- build/ optimize.js (assets)

## Requirements
- Node.js 18+
- MySQL 8+
- npm

## Setup
1) Install dependencies
```
npm install
```

2) Configure environment
Create .env (already added by tooling) with:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=agribusiness
# Optional: API port
API_PORT=4000
# Optional: DSN for tools that want a single URL
DATABASE_URL=mysql://root:root@127.0.0.1:3306/agribusiness
```

3) Database
Use an existing MySQL database configured above. Ensure the required tables and columns exist (see Database Expectations). If you need a reference DDL, see the Database Expectations section to craft a schema matching your environment.

4) Run (development)
```
npm run dev
```
- Frontend served at http://localhost:3000/pages/homepage.html
- API at http://localhost:4000/api
- Health check: http://localhost:4000/api/health

## Running (scripts)
- `npm run dev` — runs Tailwind watcher, live-server (3000), and API server (4000)
- `npm run watch:css` — Tailwind CSS watch
- `npm run serve` — Run live-server only
- `npm run api` — Run Express API server

## API Overview
Base URL: `http://localhost:4000/api`

- Health
  - GET /health → { ok: true }

- Categories
  - GET /categories → [{ id, name }]
  - POST /categories { name } (admin)

- Products
  - GET /products?category_id=&q=&active=&page=&limit=
  - GET /products/id/:id
  - GET /products/:slug
  - PATCH /products/:id (admin; { name, description, price, stock_quantity, is_active, category_id, slug })

- Services (Gardening)
  - GET /services?active=
  - GET /services/:id
  - PATCH /services/:id (admin; { service_name, description, price, is_active })

- Bookings
  - POST /bookings { user_id, service_id, booking_date, notes?, address? }
  - GET /bookings?user_id=&service_id=&status=&from=&to=&page=&limit=
  - PATCH /bookings/:id/status { status }

- Orders
  - POST /orders { user_id, delivery_address?, items:[{ product_id, quantity }] }
    - Transactional stock check; inserts order_items; decrements products.stock_quantity; updates total_amount
  - GET /orders?user_id=&status=&from=&to=&page=&limit=
  - GET /orders/:id (includes items)
  - PATCH /orders/:id/status { status }

- Payments
  - POST /payments { user_id, order_id?, booking_id?, amount, payment_method, provider_ref?, currency? }
  - GET /payments?user_id=&order_id=&booking_id=&status=&method=&from=&to=&page=&limit=
  - PATCH /payments/:id/status { status, provider_ref? }

- Logs
  - POST /logs { timestamp, action, data, userAgent, url }

CORS is preconfigured for http://localhost:3000.

## Frontend Integration (pages)

- js/main.js
  - API base: `this.API_BASE = 'http://localhost:4000/api'`
  - Logging: posts to /logs with offline retry and on-reconnect flush
  - Cart & Checkout
    - Detects `.checkout-form` submission → POST /orders then /payments → clears cart and updates UI
  - Service Booking
    - Detects `.service-booking-form` submission → POST /bookings → shows success notification
  - Notifications: ARIA-friendly and reduced-motion aware

- pages/product_marketplace.html
  - Loads products from GET /products and renders cards
  - Search bar queries /products?q=...
  - Cart counter uses `.cart-count` (auto-updated by main.js)
  - Cart sidebar footer contains a `.checkout-form` with fields: user_id (hidden), delivery_address (textarea), payment_method (hidden set to Mpesa)

- pages/garden_services_hub.html
  - Booking form `.service-booking-form` fields:
    - user_id (hidden), service_id (select loaded from GET /services), booking_date (datetime-local), address (textarea), notes (textarea)
  - Inline script sets booking datetime min and populates the service select from API

- pages/customer_dashboard.html
  - Renders recent orders and bookings from:
    - GET /orders?user_id=1&limit=5
    - GET /bookings?user_id=1&limit=5
  - Replace the demo user_id=1 with the active session user id in production

## Database Expectations
The API assumes a MySQL schema consistent with the following entities and fields (names may be adjusted if you customized):

- users: id, name, email, phone, address, role ENUM('customer','admin','gardener'), created_at
- product_categories: id, name
- products: id, name, description, price DECIMAL(12,2), stock_quantity INT, category_id FK, is_active TINYINT(1), slug (optional), created_at
- orders: id, user_id FK, order_date DATETIME, total_amount DECIMAL(12,2), status ENUM('pending','completed','cancelled'), delivery_address TEXT (optional), created_at
- order_items: id, order_id FK, product_id FK, quantity INT, price DECIMAL(12,2), created_at
- gardening_services: id, service_name, description, price DECIMAL(12,2), is_active TINYINT(1), created_at
- service_bookings: id, user_id FK, service_id FK, booking_date DATETIME, status ENUM('pending','confirmed','completed','cancelled'), notes TEXT (optional), address TEXT (optional), created_at
- payments: id, user_id FK, order_id FK NULL, booking_id FK NULL, amount DECIMAL(12,2), payment_date DATETIME, payment_method ENUM('Mpesa','Card','Cash'), status ENUM('success','failed','pending'), provider_ref VARCHAR(191) NULL, currency CHAR(3) DEFAULT 'KES', created_at

Indexes
- Suggested FKs and lookup indexes: products(category_id), products(name), orders(user_id, order_date, status), order_items(order_id, product_id), service_bookings(user_id, service_id, status, booking_date), payments(user_id, order_id, booking_id, status, payment_date)

Transactions and stock
- The POST /orders flow uses SELECT ... FOR UPDATE and updates stock atomically. Consider adding DB triggers or rely on this transactional check.

## Troubleshooting
- API health fails
  - Verify .env values, DB running, and user permissions.
  - Test credentials with `mysql -h 127.0.0.1 -P 3306 -u root -proot -e "USE agribusiness; SELECT 1;"`
- CORS errors
  - Confirm frontend runs on http://localhost:3000 and API on http://localhost:4000; update CORS origin in server/index.js if needed.
- Checkout/Booking not triggering
  - Ensure your forms have classes: `checkout-form` or `service-booking-form` and include user_id. Check console for errors.
- Empty listings
  - Ensure your DB has products/services and `is_active=1` where applicable.

## Roadmap
- AuthN/AuthZ and session-based user_id propagation
- Admin UI for products/services and lifecycle actions
- Payment provider webhooks (Mpesa/Card) to mark payments success and update orders
- Reviews table and endpoints (migrate from localStorage)
- Loyalty and subscriptions (DB tables and endpoints)
- SEO: sitemaps and canonical slugs for products/categories

---

© 2025 GreenGrove Market. All rights reserved.
