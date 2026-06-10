/**
 * routes/dashboard.js
 * ============================================================
 * Endpoint ringkasan untuk halaman Dashboard:
 *   GET /api/dashboard/summary   → Statistik bulan ini
 *   GET /api/dashboard/dept      → Distribusi per departemen
 * ============================================================
 */

const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

/**
 * GET /api/dashboard/summary
 * Query: ?bulan=7&tahun=2025
 */
router.get('/summary', async (req, res) => {
  try {
    const now   = new Date();
    const bulan = Number(req.query.bulan) || (now.getMonth() + 1);
    const tahun = Number(req.query.tahun) || now.getFullYear();

    // Total karyawan aktif
    const [[{ total_karyawan }]] = await db.execute(
      `SELECT COUNT(*) AS total_karyawan FROM employees`
    );

    // Total gaji & potongan bulan ini
    const [[payrollSummary]] = await db.execute(
      `SELECT
         COALESCE(SUM(total_gaji_bersih), 0) AS total_gaji,
         COALESCE(SUM(potongan), 0)          AS total_potongan,
         COALESCE(SUM(pajak), 0)             AS total_pajak,
         COUNT(*)                             AS total_slip
       FROM salaries
       WHERE bulan_angka = ? AND tahun = ?`,
      [bulan, tahun]
    );

    // 5 karyawan terbaru
    const [recentEmployees] = await db.execute(
      `SELECT id, nik, nama_lengkap, jabatan, departemen, status_pekerjaan, created_at
       FROM employees ORDER BY created_at DESC LIMIT 5`
    );

    return res.json({
      success: true,
      data: {
        bulan, tahun,
        total_karyawan,
        total_gaji:      payrollSummary.total_gaji,
        total_potongan:  payrollSummary.total_potongan,
        total_pajak:     payrollSummary.total_pajak,
        total_slip:      payrollSummary.total_slip,
        recent_employees: recentEmployees,
      }
    });
  } catch (err) {
    console.error('[Dashboard] summary error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard.' });
  }
});

/**
 * GET /api/dashboard/dept
 * Distribusi jumlah karyawan per departemen
 */
router.get('/dept', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT departemen, COUNT(*) AS jumlah
       FROM employees
       GROUP BY departemen
       ORDER BY jumlah DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data departemen.' });
  }
});

module.exports = router;
