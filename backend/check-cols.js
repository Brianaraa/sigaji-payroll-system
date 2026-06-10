const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCols() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sigaji_db',
    });

    const [rows] = await pool.query('SHOW COLUMNS FROM employees');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCols();
