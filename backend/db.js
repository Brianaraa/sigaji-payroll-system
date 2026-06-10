/**
 * db.js
 * ============================================================
 * Konfigurasi koneksi ke MySQL menggunakan Connection Pool.
 * Pool lebih efisien daripada single connection karena:
 *   - Koneksi di-reuse (tidak perlu buka/tutup setiap request)
 *   - Mendukung multiple request secara bersamaan
 * ============================================================
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'sigaji_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+07:00', // WIB
  decimalNumbers:     true,     // Parse tipe data DECIMAL sebagai angka, bukan string
});

// Test koneksi saat server pertama kali start
pool.getConnection()
  .then(conn => {
    console.log('✅ [DB] Terhubung ke MySQL sigaji_db');
    conn.release();
  })
  .catch(err => {
    console.error('❌ [DB] Gagal terhubung ke MySQL:', err.message);
    process.exit(1); // Keluar jika tidak bisa konek ke DB
  });

module.exports = pool;
