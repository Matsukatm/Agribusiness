// GreenGrove Market - API server (Express + MySQL2)
// Uses .env for DB connection and exposes endpoints for catalog, orders, bookings, payments, and logs.
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(helmet());
app.use(cors({ origin: /http:\/\/localhost:3000|127\.0\.0\.1:3000/, credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.API_PORT || 4000;

// DB pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'agribusiness',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helpers
const okStatuses = {
  order: new Set(['pending', 'completed', 'cancelled']),
  booking: new Set(['pending', 'confirmed', 'completed', 'cancelled'])
};
const okPaymentMethods = new Set(['Mpesa', 'Card', 'Cash']);
const okPaymentStatuses = new Set(['success', 'failed', 'pending']);

function parsePageLimit(q) {
  const page = Math.max(1, Number(q.page || 1));
  const limit = Math.min(100, Math.max(1, Number(q.limit || 20)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// Health
app.get('/api/health', async (req, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: r[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM product_categories ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const [ins] = await pool.query('INSERT INTO product_categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: ins.insertId, name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Products
app.get('/api/products', async (req, res) => {
  const { category_id, q, active } = req.query;
  const { limit, offset } = parsePageLimit(req.query);
  const where = [];
  const params = [];
  if (category_id) { where.push('p.category_id = ?'); params.push(Number(category_id)); }
  if (q) { where.push('p.name LIKE ?'); params.push(`%${q}%`); }
  if (typeof active !== 'undefined') { where.push('p.is_active = ?'); params.push(Number(active) ? 1 : 0); }
  const sql = `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.category_id, p.is_active
               FROM products p
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY p.id DESC
               LIMIT ? OFFSET ?`;
  try {
    const [rows] = await pool.query(sql, [...params, limit, offset]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/id/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug, description, price, stock_quantity, category_id, is_active FROM products WHERE id = ?', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug, description, price, stock_quantity, category_id, is_active FROM products WHERE slug = ?', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: update product fields
app.patch('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, stock_quantity, is_active, category_id, slug } = req.body || {};
  const sets = [];
  const params = [];
  if (typeof name !== 'undefined') { sets.push('name = ?'); params.push(String(name)); }
  if (typeof description !== 'undefined') { sets.push('description = ?'); params.push(String(description)); }
  if (typeof price !== 'undefined') { sets.push('price = ?'); params.push(Number(price)); }
  if (typeof stock_quantity !== 'undefined') { sets.push('stock_quantity = ?'); params.push(Number(stock_quantity)); }
  if (typeof is_active !== 'undefined') { sets.push('is_active = ?'); params.push(Number(is_active) ? 1 : 0); }
  if (typeof category_id !== 'undefined') { sets.push('category_id = ?'); params.push(Number(category_id)); }
  if (typeof slug !== 'undefined') { sets.push('slug = ?'); params.push(String(slug)); }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  try {
    const [r] = await pool.query(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    res.json({ updated: r.affectedRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Services
app.get('/api/services', async (req, res) => {
  const { active } = req.query;
  const where = [];
  const params = [];
  if (typeof active !== 'undefined') { where.push('is_active = ?'); params.push(Number(active) ? 1 : 0); }
  try {
    const [rows] = await pool.query(`SELECT id, service_name, description, price, is_active, created_at FROM gardening_services ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY service_name` , params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, service_name, description, price, is_active, created_at FROM gardening_services WHERE id = ?', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: update service status/details
app.patch('/api/services/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { service_name, description, price, is_active } = req.body || {};
  const sets = [];
  const params = [];
  if (typeof service_name !== 'undefined') { sets.push('service_name = ?'); params.push(String(service_name)); }
  if (typeof description !== 'undefined') { sets.push('description = ?'); params.push(String(description)); }
  if (typeof price !== 'undefined') { sets.push('price = ?'); params.push(Number(price)); }
  if (typeof is_active !== 'undefined') { sets.push('is_active = ?'); params.push(Number(is_active) ? 1 : 0); }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  try {
    const [r] = await pool.query(`UPDATE gardening_services SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    res.json({ updated: r.affectedRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bookings
app.post('/api/bookings', async (req, res) => {
  const { user_id, service_id, booking_date, notes, address } = req.body || {};
  if (!user_id || !service_id || !booking_date) return res.status(400).json({ error: 'Missing fields' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [svc] = await conn.query('SELECT id FROM gardening_services WHERE id = ? AND is_active = 1', [service_id]);
    if (!svc.length) throw new Error('Invalid service');

    const [ins] = await conn.query(
      'INSERT INTO service_bookings (user_id, service_id, booking_date, status, notes, address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [user_id, service_id, new Date(booking_date), 'pending', notes || null, address || null]
    );
    await conn.commit();
    res.status(201).json({ id: ins.insertId, status: 'pending' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

app.get('/api/bookings', async (req, res) => {
  const { user_id, service_id, status, from, to } = req.query;
  const { limit, offset } = parsePageLimit(req.query);
  const where = [];
  const params = [];
  if (user_id) { where.push('b.user_id = ?'); params.push(Number(user_id)); }
  if (service_id) { where.push('b.service_id = ?'); params.push(Number(service_id)); }
  if (status) { where.push('b.status = ?'); params.push(String(status)); }
  if (from) { where.push('b.booking_date >= ?'); params.push(new Date(from)); }
  if (to) { where.push('b.booking_date < ?'); params.push(new Date(to)); }
  const sql = `SELECT b.id, b.user_id, b.service_id, b.booking_date, b.status, b.notes, b.address, b.created_at,
                      s.service_name
               FROM service_bookings b JOIN gardening_services s ON s.id = b.service_id
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY b.booking_date DESC
               LIMIT ? OFFSET ?`;
  try {
    const [rows] = await pool.query(sql, [...params, limit, offset]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/bookings/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!okStatuses.booking.has(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const [r] = await pool.query('UPDATE service_bookings SET status = ? WHERE id = ?', [status, id]);
    res.json({ updated: r.affectedRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Orders
app.post('/api/orders', async (req, res) => {
  const { user_id, items, delivery_address } = req.body || {};
  if (!user_id || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Invalid payload' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderIns] = await conn.query(
      'INSERT INTO orders (user_id, order_date, total_amount, status, delivery_address, created_at) VALUES (?, NOW(), 0, ?, ?, NOW())',
      [user_id, 'pending', delivery_address || null]
    );

    let total = 0;
    for (const it of items) {
      const pid = Number(it.product_id);
      const qty = Math.max(1, Number(it.quantity));
      const [prow] = await conn.query('SELECT id, price, stock_quantity FROM products WHERE id = ? FOR UPDATE', [pid]);
      if (!prow.length) throw new Error('Product not found');
      const p = prow[0];
      if (p.stock_quantity < qty) throw new Error('Insufficient stock');

      const price = Number(p.price);
      total += price * qty;

      await conn.query('INSERT INTO order_items (order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, NOW())', [orderIns.insertId, pid, qty, price]);
      await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [qty, pid]);
    }

    await conn.query('UPDATE orders SET total_amount = ? WHERE id = ?', [total, orderIns.insertId]);
    await conn.commit();
    res.status(201).json({ id: orderIns.insertId, total_amount: total, status: 'pending' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

app.get('/api/orders', async (req, res) => {
  const { user_id, status, from, to } = req.query;
  const { limit, offset } = parsePageLimit(req.query);
  const where = [];
  const params = [];
  if (user_id) { where.push('o.user_id = ?'); params.push(Number(user_id)); }
  if (status) { where.push('o.status = ?'); params.push(String(status)); }
  if (from) { where.push('o.order_date >= ?'); params.push(new Date(from)); }
  if (to) { where.push('o.order_date < ?'); params.push(new Date(to)); }
  const sql = `SELECT o.id, o.user_id, o.order_date, o.total_amount, o.status, o.delivery_address
               FROM orders o
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY o.order_date DESC
               LIMIT ? OFFSET ?`;
  try {
    const [rows] = await pool.query(sql, [...params, limit, offset]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [[order]] = await pool.query('SELECT id, user_id, order_date, total_amount, status, delivery_address FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    const [items] = await pool.query('SELECT oi.id, oi.product_id, p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?', [id]);
    res.json({ ...order, items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!okStatuses.order.has(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const [r] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ updated: r.affectedRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Payments
app.post('/api/payments', async (req, res) => {
  const { user_id, order_id, booking_id, amount, payment_method, provider_ref, currency = 'KES' } = req.body || {};
  if (!user_id || !amount || !payment_method) return res.status(400).json({ error: 'Missing fields' });
  if (!okPaymentMethods.has(payment_method)) return res.status(400).json({ error: 'Invalid payment_method' });
  try {
    const [ins] = await pool.query(
      'INSERT INTO payments (user_id, order_id, booking_id, amount, payment_date, payment_method, status, provider_ref, currency, created_at) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW())',
      [user_id, order_id || null, booking_id || null, Number(amount), payment_method, 'pending', provider_ref || null, currency]
    );
    res.status(201).json({ id: ins.insertId, status: 'pending' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payments', async (req, res) => {
  const { user_id, order_id, booking_id, status, method, from, to } = req.query;
  const { limit, offset } = parsePageLimit(req.query);
  const where = [];
  const params = [];
  if (user_id) { where.push('p.user_id = ?'); params.push(Number(user_id)); }
  if (order_id) { where.push('p.order_id = ?'); params.push(Number(order_id)); }
  if (booking_id) { where.push('p.booking_id = ?'); params.push(Number(booking_id)); }
  if (status) { where.push('p.status = ?'); params.push(String(status)); }
  if (method) { where.push('p.payment_method = ?'); params.push(String(method)); }
  if (from) { where.push('p.payment_date >= ?'); params.push(new Date(from)); }
  if (to) { where.push('p.payment_date < ?'); params.push(new Date(to)); }
  const sql = `SELECT p.id, p.user_id, p.order_id, p.booking_id, p.amount, p.payment_date, p.payment_method, p.status, p.provider_ref, p.currency
               FROM payments p
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY p.payment_date DESC
               LIMIT ? OFFSET ?`;
  try {
    const [rows] = await pool.query(sql, [...params, limit, offset]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/payments/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status, provider_ref } = req.body || {};
  if (!okPaymentStatuses.has(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const [r] = await pool.query('UPDATE payments SET status = ?, provider_ref = COALESCE(?, provider_ref) WHERE id = ?', [status, provider_ref || null, id]);
    res.json({ updated: r.affectedRows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Client logs (can be persisted to a table later)
app.post('/api/logs', async (req, res) => {
  try {
    console.log('[client-log]', req.body?.action || 'log', req.body);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[API] listening on http://localhost:${PORT}`);
});
