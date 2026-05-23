/**
 * MODULE: constants.js
 * Berisi semua konstanta sistem penggajian.
 * Dipusatkan di satu tempat agar mudah diuji (whitebox) dan dimodifikasi.
 */

const CONSTANTS = {

  // ── GAJI POKOK berdasarkan GOLONGAN ──
  // (dalam rupiah per bulan)
  GAJI_POKOK: {
    "I":   2_500_000,
    "II":  3_500_000,
    "III": 5_000_000,
    "IV":  7_500_000,
    "V":  12_000_000,
  },

  // ── TUNJANGAN berdasarkan JABATAN ──
  TUNJANGAN_JABATAN: {
    "Direktur":    5_000_000,
    "Manajer":     2_500_000,
    "Supervisor":  1_500_000,
    "Staff Senior":  750_000,
    "Staff Junior":  300_000,
    "Magang":            0,
  },

  // ── TUNJANGAN TETAP (berlaku semua karyawan kecuali magang) ──
  TUNJANGAN_TRANSPORT: 300_000,
  TUNJANGAN_MAKAN:     250_000,

  // Tunjangan magang dikurangi
  TUNJANGAN_TRANSPORT_MAGANG: 150_000,
  TUNJANGAN_MAKAN_MAGANG:     100_000,

  // ── LEMBUR ──
  // Tarif lembur = (Gaji Pokok / 173) × 1.5 per jam
  // 173 = rata-rata jam kerja per bulan (sesuai ketentuan Kemenaker)
  FAKTOR_LEMBUR: 1.5,
  JAM_KERJA_BULANAN: 173,
  MAX_JAM_LEMBUR: 100,

  // ── BPJS ──
  BPJS_KESEHATAN_PERSEN: 0.01,      // 1%
  BPJS_KETENAGAKERJAAN_PERSEN: 0.02, // 2%
  BPJS_MAX_GAJI:  12_000_000, // Batas maksimal penghitungan BPJS Kesehatan

  // ── POTONGAN ABSENSI ──
  // Potongan = (Gaji Pokok / 26) × jumlah_hari_tidak_hadir
  // 26 = hari kerja dalam sebulan
  HARI_KERJA_BULANAN: 26,
  MAX_HARI_ABSENSI: 26,

  // ── PPh 21 — PTKP (Penghasilan Tidak Kena Pajak) ──
  // Per tahun (sesuai PMK 101/PMK.010/2016)
  PTKP: {
    "TK0": 54_000_000,
    "TK1": 58_500_000,
    "TK2": 63_000_000,
    "TK3": 67_500_000,
    "K0":  58_500_000,
    "K1":  63_000_000,
    "K2":  67_500_000,
    "K3":  72_000_000,
  },

  // ── PPh 21 — TARIF PROGRESIF (UU HPP 2021) ──
  // Bracket penghasilan kena pajak (PKP) per tahun
  PPH21_BRACKETS: [
    { batas_bawah: 0,          batas_atas: 60_000_000,   tarif: 0.05 },
    { batas_bawah: 60_000_000, batas_atas: 250_000_000,  tarif: 0.15 },
    { batas_bawah: 250_000_000, batas_atas: 500_000_000, tarif: 0.25 },
    { batas_bawah: 500_000_000, batas_atas: 5_000_000_000, tarif: 0.30 },
    { batas_bawah: 5_000_000_000, batas_atas: Infinity,  tarif: 0.35 },
  ],

  // ── BIAYA JABATAN ──
  // Pengurang penghasilan bruto sebelum dihitung PKP
  BIAYA_JABATAN_PERSEN: 0.05,
  BIAYA_JABATAN_MAX: 6_000_000, // per tahun

  // ── MULTIPLIER STATUS ──
  // Karyawan kontrak: tidak dapat tunjangan jabatan penuh
  // Karyawan magang: gaji pokok lebih rendah, tidak ada BPJS ketenagakerjaan
  MULTIPLIER_STATUS: {
    "Tetap":   1.0,
    "Kontrak": 0.85,
    "Magang":  0.5,
  },

  // ── DEPARTEMEN ──
  DEPARTEMEN: ["IT", "HRD", "Keuangan", "Marketing", "Operasional", "Produksi"],

  // ── BULAN ──
  BULAN: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ],
};

// Freeze object agar tidak bisa dimodifikasi di runtime (immutability)
Object.freeze(CONSTANTS);
Object.freeze(CONSTANTS.GAJI_POKOK);
Object.freeze(CONSTANTS.TUNJANGAN_JABATAN);
Object.freeze(CONSTANTS.PTKP);
Object.freeze(CONSTANTS.PPH21_BRACKETS);
Object.freeze(CONSTANTS.MULTIPLIER_STATUS);
