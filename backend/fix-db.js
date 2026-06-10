const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDB() {
  try {
    console.log("Menghubungkan ke database...");
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sigaji_db',
    });

    // Fix created_at
    try {
      await pool.query(`ALTER TABLE salaries ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log("Kolom created_at berhasil ditambahkan ke salaries.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("Kolom created_at sudah ada.");
      else console.error("Error add created_at:", e.message);
    }

    // Fix bulan_angka
    try {
      await pool.query(`ALTER TABLE salaries ADD COLUMN bulan_angka INT NOT NULL DEFAULT 1 AFTER periode_bulan`);
      await pool.query(`ALTER TABLE salaries ADD COLUMN tahun INT NOT NULL DEFAULT 2025 AFTER bulan_angka`);
      await pool.query(`ALTER TABLE salaries ADD COLUMN jam_lembur DECIMAL(8,2) DEFAULT 0 AFTER total_gaji_bersih`);
      await pool.query(`ALTER TABLE salaries ADD COLUMN hari_absensi INT DEFAULT 0 AFTER jam_lembur`);
      console.log("Kolom bulan_angka dll berhasil ditambahkan.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("Kolom bulan_angka sudah ada.");
      else console.error("Error add bulan_angka:", e.message);
    }

    // Fix unique index
    try {
      await pool.query(`ALTER TABLE salaries ADD UNIQUE INDEX unique_salary_period (employee_id, bulan_angka, tahun)`);
      console.log("Unique index berhasil ditambahkan.");
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') console.log("Unique index sudah ada.");
      else console.error("Error add index:", e.message);
    }

    // Fix employees columns
    try {
      await pool.query(`ALTER TABLE employees ADD COLUMN golongan VARCHAR(10) DEFAULT NULL AFTER status_pekerjaan`);
      await pool.query(`ALTER TABLE employees ADD COLUMN ptkp VARCHAR(20) DEFAULT NULL AFTER golongan`);
      await pool.query(`ALTER TABLE employees ADD COLUMN npwp VARCHAR(30) DEFAULT NULL AFTER ptkp`);
      console.log("Kolom employees berhasil ditambahkan.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("Kolom employees sudah ada.");
      else console.error("Error add employees col:", e.message);
    }

    // Fix status lowercase
    await pool.query(`UPDATE employees SET status_pekerjaan = 'Tetap' WHERE LOWER(status_pekerjaan) = 'tetap'`);
    await pool.query(`UPDATE employees SET status_pekerjaan = 'Kontrak' WHERE LOWER(status_pekerjaan) = 'kontrak'`);
    await pool.query(`UPDATE employees SET status_pekerjaan = 'Magang' WHERE LOWER(status_pekerjaan) = 'magang'`);
    console.log("Status karyawan berhasil di-update (Tetap/Kontrak/Magang).");

    console.log("Database fix selesai!");
    process.exit(0);
  } catch (err) {
    console.error("Fatal Error:", err);
    process.exit(1);
  }
}

fixDB();
