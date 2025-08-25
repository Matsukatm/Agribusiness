-- GreenGrove Market - Core Database Schema (PostgreSQL)
-- This script creates all tables, relationships, constraints, and indexes
-- for a grocery and gardening services platform per provided requirements.

BEGIN;

-- 1) Users
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT,
    address         TEXT,
    role            VARCHAR(20) NOT NULL,
    CONSTRAINT users_role_chk CHECK (role IN ('customer', 'admin', 'gardener'))
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 3) ProductCategories (create before Products for FK)
CREATE TABLE IF NOT EXISTS product_categories (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- 2) Products (Grocery items)
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    stock_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id     INTEGER NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- 4) Orders
CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    status          VARCHAR(20) NOT NULL,
    CONSTRAINT orders_status_chk CHECK (status IN ('pending', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- 5) OrderItems
CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- 6) GardeningServices
CREATE TABLE IF NOT EXISTS gardening_services (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_services_name ON gardening_services(service_name);

-- 7) ServiceBookings
CREATE TABLE IF NOT EXISTS service_bookings (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    service_id      INTEGER NOT NULL REFERENCES gardening_services(id) ON DELETE RESTRICT,
    booking_date    TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL,
    CONSTRAINT service_bookings_status_chk CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON service_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON service_bookings(booking_date);

-- 8) Payments
CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_id        INTEGER REFERENCES orders(id) ON DELETE RESTRICT,
    booking_id      INTEGER REFERENCES service_bookings(id) ON DELETE RESTRICT,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    payment_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method  VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    CONSTRAINT payments_method_chk CHECK (payment_method IN ('Mpesa', 'Card', 'Cash')),
    CONSTRAINT payments_status_chk CHECK (status IN ('success', 'failed', 'pending')),
    -- At least one of order_id or booking_id must be provided
    CONSTRAINT payments_target_chk CHECK (order_id IS NOT NULL OR booking_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

COMMIT;
