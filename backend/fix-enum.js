const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixEnum() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sigaji_db',
    });

    console.log("Mengubah tipe ENUM status_pekerjaan...");
    await pool.query("ALTER TABLE employees MODIFY COLUMN status_pekerjaan VARCHAR(50) DEFAULT 'Tetap'");
    
    console.log("Mengupdate data yang ada...");
    await pool.query("UPDATE employees SET status_pekerjaan = 'Tetap' WHERE LOWER(status_pekerjaan) = 'tetap'");
    await pool.query("UPDATE employees SET status_pekerjaan = 'Kontrak' WHERE LOWER(status_pekerjaan) = 'kontrak'");
    await pool.query("UPDATE employees SET status_pekerjaan = 'Magang' WHERE LOWER(status_pekerjaan) IN ('magang', 'freelance')");
    
    console.log("Selesai memperbaiki status_pekerjaan!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixEnum();
