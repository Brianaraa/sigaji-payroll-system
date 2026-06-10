/**
 * routes/employees.js
 * ============================================================
 * CRUD Endpoints untuk data karyawan:
 *   GET    /api/employees         → Ambil semua karyawan (+ search/filter)
 *   GET    /api/employees/:id     → Ambil satu karyawan
 *   POST   /api/employees         → Tambah karyawan baru
 *   PUT    /api/employees/:id     → Update data karyawan
 *   DELETE /api/employees/:id     → Hapus karyawan
 * ============================================================
 */

const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Semua route di sini membutuhkan token (login dulu)
router.use(verifyToken);

/**
 * GET /api/employees
 * Query params: ?search=nama&departemen=IT&status=Tetap
 */
router.get('/', async (req, res) => {
  try {
    const { search = '', departemen = '', status = '' } = req.query;

    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (nama_lengkap LIKE ? OR nik LIKE ? OR jabatan LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (departemen) {
      query += ' AND departemen = ?';
      params.push(departemen);
    }
    if (status) {
      query += ' AND status_pekerjaan = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('[Employees] GET error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data karyawan.' });
  }
});

/**
 * GET /api/employees/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Employees] GET/:id error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

/**
 * POST /api/employees
 * Body: { nik, nama_lengkap, email, jabatan, departemen, tanggal_bergabung,
 *         gaji_pokok, status_pekerjaan, golongan, ptkp, npwp }
 */
router.post('/', async (req, res) => {
  const {
    nik, nama_lengkap, email, jabatan, departemen,
    tanggal_bergabung, gaji_pokok, status_pekerjaan,
    golongan, ptkp, npwp
  } = req.body;

  // Validasi wajib
  if (!nik || !nama_lengkap || !gaji_pokok) {
    return res.status(400).json({ success: false, message: 'NIK, Nama, dan Gaji Pokok wajib diisi.' });
  }

  try {
    // Cek duplikat NIK
    const [existing] = await db.execute('SELECT id FROM employees WHERE nik = ?', [nik]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `NIK ${nik} sudah terdaftar.` });
    }

    const [result] = await db.execute(
      `INSERT INTO employees 
        (nik, nama_lengkap, email, jabatan, departemen, tanggal_bergabung, gaji_pokok, status_pekerjaan, golongan, ptkp, npwp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nik, nama_lengkap, email || null, jabatan, departemen,
        tanggal_bergabung || null, gaji_pokok,
        status_pekerjaan || 'tetap', golongan || null, ptkp || null, npwp || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Karyawan berhasil ditambahkan.',
      id: result.insertId,
    });
  } catch (err) {
    console.error('[Employees] POST error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan data karyawan.' });
  }
});

/**
 * PUT /api/employees/:id
 */
router.put('/:id', async (req, res) => {
  const {
    nik, nama_lengkap, email, jabatan, departemen,
    tanggal_bergabung, gaji_pokok, status_pekerjaan,
    golongan, ptkp, npwp
  } = req.body;

  try {
    // Cek karyawan ada
    const [existing] = await db.execute('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
    }

    // Cek duplikat NIK (kecuali milik sendiri)
    if (nik) {
      const [dupNik] = await db.execute(
        'SELECT id FROM employees WHERE nik = ? AND id != ?',
        [nik, req.params.id]
      );
      if (dupNik.length > 0) {
        return res.status(409).json({ success: false, message: `NIK ${nik} sudah digunakan karyawan lain.` });
      }
    }

    await db.execute(
      `UPDATE employees SET
        nik = COALESCE(?, nik),
        nama_lengkap = COALESCE(?, nama_lengkap),
        email = COALESCE(?, email),
        jabatan = COALESCE(?, jabatan),
        departemen = COALESCE(?, departemen),
        tanggal_bergabung = COALESCE(?, tanggal_bergabung),
        gaji_pokok = COALESCE(?, gaji_pokok),
        status_pekerjaan = COALESCE(?, status_pekerjaan),
        golongan = COALESCE(?, golongan),
        ptkp = COALESCE(?, ptkp),
        npwp = COALESCE(?, npwp)
       WHERE id = ?`,
      [
        nik || null, nama_lengkap || null, email || null,
        jabatan || null, departemen || null, tanggal_bergabung || null,
        gaji_pokok || null, status_pekerjaan || null,
        golongan || null, ptkp || null, npwp || null,
        req.params.id
      ]
    );

    return res.json({ success: true, message: 'Data karyawan berhasil diperbarui.' });
  } catch (err) {
    console.error('[Employees] PUT error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data karyawan.' });
  }
});

/**
 * DELETE /api/employees/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
    }

    await db.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Karyawan berhasil dihapus.' });
  } catch (err) {
    console.error('[Employees] DELETE error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus karyawan.' });
  }
});

module.exports = router;
