/**
 * seed-admin.js
 * ============================================================
 * Script sekali jalan untuk membuat akun admin pertama di database.
 * Jalankan: node seed-admin.js
 * ============================================================
 */

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'sigaji_db',
    });

    console.log('✅ Terhubung ke database...');

    // Hash password dengan bcrypt (cost factor 10)
    const plainPassword = 'sigaji2025';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Cek apakah admin sudah ada
    const [existing] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@sigaji.id']
    );

    if (existing.length > 0) {
      console.log('ℹ️  Akun admin sudah ada. Tidak ada perubahan.');
    } else {
      await conn.execute(
        `INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Administrator', 'admin@sigaji.id', hashedPassword, 'admin']
      );
      console.log('✅ Akun admin berhasil dibuat!');
      console.log('   📧 Email    : admin@sigaji.id');
      console.log('   🔑 Password : sigaji2025');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}

seedAdmin();
