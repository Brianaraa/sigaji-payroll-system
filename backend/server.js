/**
 * server.js
 * ============================================================
 * Entry point backend SiGaji.
 * Menginisialisasi Express, middleware, dan semua route API.
 * ============================================================
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Import route handlers
const authRoutes      = require('./routes/auth');
const employeeRoutes  = require('./routes/employees');
const payrollRoutes   = require('./routes/payroll');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────────────────

// CORS: izinkan request dari frontend (port berbeda saat dev)
app.use(cors({
  origin: '*', // Izinkan semua origin untuk dev/portofolio
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── STATIC FILES ────────────────────────────────────────────
// Serve file frontend langsung dari Express (opsional, untuk kemudahan demo)
// Pastikan path mengarah ke folder root project (satu level di atas backend/)
app.use(express.static(path.join(__dirname, '..')));

// ── API ROUTES ──────────────────────────────────────────────
app.use('/api', authRoutes);           // POST /api/login, GET /api/me
app.use('/api/employees',  employeeRoutes);   // CRUD /api/employees
app.use('/api/payroll',    payrollRoutes);    // CRUD /api/payroll
app.use('/api/dashboard',  dashboardRoutes);  // GET  /api/dashboard/summary

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SiGaji API berjalan normal 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ── 404 HANDLER ─────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint '${req.path}' tidak ditemukan.` });
});

// ── ERROR HANDLER ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
});

// ── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log(`║   SiGaji Backend API — PORT ${PORT}       ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log(`🌐 Frontend : http://localhost:${PORT}/login.html`);
  console.log(`🔌 API Base : http://localhost:${PORT}/api`);
  console.log(`❤  Health  : http://localhost:${PORT}/api/health`);
});
