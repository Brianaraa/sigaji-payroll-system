/**
 * routes/payroll.js
 * ============================================================
 * Endpoints untuk data penggajian (slip gaji):
 *   GET  /api/payroll            → Ambil penggajian (filter bulan/tahun)
 *   GET  /api/payroll/:id        → Ambil satu slip gaji
 *   POST /api/payroll            → Simpan/update slip gaji
 *   DELETE /api/payroll/:id      → Hapus slip gaji
 * ============================================================
 */

const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

/**
 * GET /api/payroll
 * Query: ?bulan=7&tahun=2025&departemen=IT
 */
router.get('/', async (req, res) => {
  try {
    const { bulan, tahun, departemen = '' } = req.query;

    let query = `
      SELECT s.*, e.nama_lengkap, e.nik, e.jabatan, e.departemen, e.status_pekerjaan
      FROM salaries s
      JOIN employees e ON s.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (bulan) { query += ' AND s.bulan_angka = ?'; params.push(Number(bulan)); }
    if (tahun) { query += ' AND s.tahun = ?';       params.push(Number(tahun)); }
    if (departemen) { query += ' AND e.departemen = ?'; params.push(departemen); }

    query += ' ORDER BY s.created_at DESC';

    const [rows] = await db.execute(query, params);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('[Payroll] GET error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data penggajian.' });
  }
});

/**
 * GET /api/payroll/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, e.nama_lengkap, e.nik, e.jabatan, e.departemen
       FROM salaries s JOIN employees e ON s.employee_id = e.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data penggajian tidak ditemukan.' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

/**
 * POST /api/payroll
 * Body: { employee_id, periode_bulan, bulan_angka, tahun,
 *         gaji_pokok, tunjangan, potongan, pajak,
 *         total_gaji_bersih, jam_lembur, hari_absensi,
 *         status_pembayaran, tanggal_pembayaran }
 */
router.post('/', async (req, res) => {
  const {
    employee_id, periode_bulan, bulan_angka, tahun,
    gaji_pokok, tunjangan = 0, potongan = 0, pajak = 0,
    total_gaji_bersih, jam_lembur = 0, hari_absensi = 0,
    status_pembayaran = 'belum_dibayar', tanggal_pembayaran = null
  } = req.body;

  if (!employee_id || !periode_bulan || !bulan_angka || !tahun || !total_gaji_bersih) {
    return res.status(400).json({ success: false, message: 'Data penggajian tidak lengkap.' });
  }

  try {
    // Cek apakah slip sudah ada (upsert berdasarkan employee_id + bulan + tahun)
    const [existing] = await db.execute(
      'SELECT id FROM salaries WHERE employee_id = ? AND bulan_angka = ? AND tahun = ?',
      [employee_id, bulan_angka, tahun]
    );

    if (existing.length > 0) {
      // UPDATE
      await db.execute(
        `UPDATE salaries SET
          periode_bulan = ?, gaji_pokok = ?, tunjangan = ?, potongan = ?,
          pajak = ?, total_gaji_bersih = ?, jam_lembur = ?, hari_absensi = ?,
          status_pembayaran = ?, tanggal_pembayaran = ?
         WHERE employee_id = ? AND bulan_angka = ? AND tahun = ?`,
        [
          periode_bulan, gaji_pokok, tunjangan, potongan,
          pajak, total_gaji_bersih, jam_lembur, hari_absensi,
          status_pembayaran, tanggal_pembayaran,
          employee_id, bulan_angka, tahun
        ]
      );
      return res.json({ success: true, message: 'Data penggajian berhasil diperbarui.' });
    } else {
      // INSERT
      const [result] = await db.execute(
        `INSERT INTO salaries
          (employee_id, periode_bulan, bulan_angka, tahun, gaji_pokok, tunjangan, potongan,
           pajak, total_gaji_bersih, jam_lembur, hari_absensi, status_pembayaran, tanggal_pembayaran)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id, periode_bulan, bulan_angka, tahun, gaji_pokok, tunjangan, potongan,
          pajak, total_gaji_bersih, jam_lembur, hari_absensi, status_pembayaran, tanggal_pembayaran
        ]
      );
      return res.status(201).json({
        success: true, message: 'Slip gaji berhasil disimpan.', id: result.insertId
      });
    }
  } catch (err) {
    console.error('[Payroll] POST error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan data penggajian.' });
  }
});

/**
 * PATCH /api/payroll/:id/bayar
 * Tandai slip gaji sebagai sudah dibayar
 */
router.patch('/:id/bayar', async (req, res) => {
  try {
    await db.execute(
      `UPDATE salaries SET status_pembayaran = 'sudah_dibayar', tanggal_pembayaran = CURDATE() WHERE id = ?`,
      [req.params.id]
    );
    return res.json({ success: true, message: 'Status pembayaran berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status pembayaran.' });
  }
});

/**
 * DELETE /api/payroll/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM salaries WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Data penggajian berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus data penggajian.' });
  }
});

module.exports = router;
