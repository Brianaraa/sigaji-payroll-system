-- ============================================================
-- update-schema.sql
-- Jalankan query ini di MySQL untuk melengkapi schema yang sudah ada.
-- ============================================================

USE sigaji_db;

-- Tambah kolom yang dibutuhkan di tabel employees (jika belum ada)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS golongan VARCHAR(10)   DEFAULT NULL AFTER status_pekerjaan,
  ADD COLUMN IF NOT EXISTS ptkp     VARCHAR(20)   DEFAULT NULL AFTER golongan,
  ADD COLUMN IF NOT EXISTS npwp     VARCHAR(30)   DEFAULT NULL AFTER ptkp;

-- Tambah kolom bulan_angka & jam_lembur & hari_absensi di tabel salaries
ALTER TABLE salaries
  ADD COLUMN IF NOT EXISTS bulan_angka  INT(2)        NOT NULL DEFAULT 1  AFTER periode_bulan,
  ADD COLUMN IF NOT EXISTS tahun        INT(4)        NOT NULL DEFAULT 2025 AFTER bulan_angka,
  ADD COLUMN IF NOT EXISTS jam_lembur   DECIMAL(8,2)  DEFAULT 0 AFTER total_gaji_bersih,
  ADD COLUMN IF NOT EXISTS hari_absensi INT           DEFAULT 0 AFTER jam_lembur;

-- Pastikan index unik untuk mencegah slip gaji duplikat
ALTER TABLE salaries
  ADD UNIQUE INDEX IF NOT EXISTS unique_salary_period (employee_id, bulan_angka, tahun);

-- Konfirmasi
SELECT 'Schema berhasil diperbarui!' AS status;
