/**
 * middleware/auth.js
 * ============================================================
 * Middleware untuk memverifikasi JWT token pada setiap request
 * yang membutuhkan autentikasi.
 * ============================================================
 */

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, nama, role }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

module.exports = { verifyToken };
