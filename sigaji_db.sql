-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 09 Jun 2026 pada 15.14
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sigaji_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_keluar` time DEFAULT NULL,
  `status` enum('hadir','sakit','izin','alpa') DEFAULT 'hadir'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `nik` varchar(20) NOT NULL,
  `nama_lengkap` varchar(150) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `jabatan` varchar(100) DEFAULT NULL,
  `departemen` varchar(100) DEFAULT NULL,
  `tanggal_bergabung` date DEFAULT NULL,
  `gaji_pokok` decimal(15,2) NOT NULL,
  `status_pekerjaan` varchar(50) DEFAULT 'Tetap',
  `golongan` varchar(10) DEFAULT NULL,
  `ptkp` varchar(20) DEFAULT NULL,
  `npwp` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `employees`
--

INSERT INTO `employees` (`id`, `nik`, `nama_lengkap`, `email`, `jabatan`, `departemen`, `tanggal_bergabung`, `gaji_pokok`, `status_pekerjaan`, `golongan`, `ptkp`, `npwp`, `created_at`) VALUES
(3, '01', 'Nawra', NULL, 'Direktur', 'IT', NULL, 12000000.00, 'Tetap', 'V', 'TK1', NULL, '2026-06-09 11:06:41'),
(4, '02', 'lobotomi', NULL, 'Direktur', 'Keuangan', NULL, 2500000.00, 'Tetap', 'I', 'TK0', NULL, '2026-06-09 11:11:54'),
(5, '023', 'Komci', NULL, 'Manajer', 'Produksi', NULL, 7500000.00, 'Tetap', 'IV', 'K2', NULL, '2026-06-09 11:34:14'),
(6, '0001', 'Kundarto', NULL, 'Staff Junior', 'HRD', NULL, 6375000.00, 'Kontrak', 'IV', 'TK0', NULL, '2026-06-09 11:43:12');

-- --------------------------------------------------------

--
-- Struktur dari tabel `leaves`
--

CREATE TABLE `leaves` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `jenis_cuti` enum('tahunan','sakit','melahirkan','penting') NOT NULL,
  `status_pengajuan` enum('pending','disetujui','ditolak') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `salaries`
--

CREATE TABLE `salaries` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `periode_bulan` varchar(20) NOT NULL,
  `bulan_angka` int(11) NOT NULL DEFAULT 1,
  `tahun` int(11) NOT NULL DEFAULT 2025,
  `gaji_pokok` decimal(15,2) NOT NULL,
  `tunjangan` decimal(15,2) DEFAULT 0.00,
  `potongan` decimal(15,2) DEFAULT 0.00,
  `pajak` decimal(15,2) DEFAULT 0.00,
  `total_gaji_bersih` decimal(15,2) NOT NULL,
  `jam_lembur` decimal(8,2) DEFAULT 0.00,
  `hari_absensi` int(11) DEFAULT 0,
  `status_pembayaran` enum('belum_dibayar','sudah_dibayar') DEFAULT 'belum_dibayar',
  `tanggal_pembayaran` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `salaries`
--

INSERT INTO `salaries` (`id`, `employee_id`, `periode_bulan`, `bulan_angka`, `tahun`, `gaji_pokok`, `tunjangan`, `potongan`, `pajak`, `total_gaji_bersih`, `jam_lembur`, `hari_absensi`, `status_pembayaran`, `tanggal_pembayaran`, `created_at`) VALUES
(1, 4, 'Juni 2026', 6, 2026, 2500000.00, 5550000.00, 333677.00, 0.00, 7824705.00, 5.00, 1, 'belum_dibayar', NULL, '2026-06-09 11:23:57'),
(2, 3, 'Juni 2026', 6, 2026, 12000000.00, 5550000.00, 3233605.00, 2310528.00, 18478245.00, 40.00, 2, 'belum_dibayar', NULL, '2026-06-09 11:23:59'),
(3, 5, 'Juni 2026', 6, 2026, 7500000.00, 3050000.00, 969842.00, 681380.00, 11531025.00, 30.00, 1, 'belum_dibayar', NULL, '2026-06-09 11:34:22'),
(4, 6, 'Juni 2026', 6, 2026, 6375000.00, 700000.00, 302313.00, 302313.00, 6772687.00, 0.00, 0, 'belum_dibayar', NULL, '2026-06-09 11:43:16');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','hr','direktur') DEFAULT 'hr',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `nama`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Brianara', 'admin@sigaji.id', '$2a$10$EmtWAd2hgmmz/0map6pMmeo6pDIklSXPlBSHi8zciKydHGuqsqagu', 'admin', '2026-06-08 14:12:34');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indeks untuk tabel `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeks untuk tabel `leaves`
--
ALTER TABLE `leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indeks untuk tabel `salaries`
--
ALTER TABLE `salaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_salary_period` (`employee_id`,`bulan_angka`,`tahun`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `leaves`
--
ALTER TABLE `leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `salaries`
--
ALTER TABLE `salaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `leaves`
--
ALTER TABLE `leaves`
  ADD CONSTRAINT `leaves_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `salaries`
--
ALTER TABLE `salaries`
  ADD CONSTRAINT `salaries_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
