# 📊 SiGaji — Sistem Penggajian & Manajemen Karyawan

**SiGaji** adalah platform manajemen karyawan dan penggajian (payroll) digital berbasis web yang dirancang untuk memberikan solusi perhitungan gaji yang akurat, transparan, dan efisien bagi perusahaan skala kecil hingga menengah (SME).

Aplikasi ini mengintegrasikan administrasi data karyawan, pencatatan transaksi bulanan, kalkulasi potongan BPJS, wajib pajak PPh 21 sesuai aturan UU HPP terbaru, serta dilengkapi modul simulasi kebijakan (what-if analysis) dan visualisasi analitik interaktif.

---

## ✨ Fitur Utama

- **Manajemen Karyawan (HR Portal)**
  Pencatatan data karyawan secara lengkap meliputi NIK, Nama, Jabatan, Golongan, Departemen, Status Kerja (Tetap/Kontrak/Magang), NPWP, serta Status PTKP untuk wajib pajak.

- **Kalkulasi Gaji Otomatis & Akurat**
  Sistem kalkulasi otomatis mencakup:
  - **Gaji Pokok & Tunjangan:** Dinamis berdasarkan golongan (I s.d V), jabatan, dan status kerja.
  - **Lembur:** Formula lembur standar nasional `(Gaji Pokok / 173) * 1.5 * Jam Lembur`.
  - **BPJS Kesehatan & Ketenagakerjaan:** Pemotongan otomatis sesuai persentase regulasi BPJS terbaru.
  - **PPh 21 Progresif (UU HPP):** Simulasi perhitungan pajak berlapis (5 bracket) berdasarkan kode PTKP terbaru.
  - **Denda Absensi:** Potongan proporsional otomatis berdasarkan absen hari kerja.

- **Analitik & Simulasi Kebijakan (What-If)**
  - **Dashboard Real-time:** Visualisasi total pengeluaran payroll, rata-rata gaji, dan distribusi departemen dengan grafik interaktif.
  - **Simulasi Kebijakan:** Fitur interaktif untuk menyimulasikan dampak perubahan UMR, persentase BPJS, atau tunjangan terhadap pengeluaran total perusahaan secara real-time.

- **Penerbitan Slip Gaji & Laporan**
  - **Slip Gaji Digital:** Rincian detail pendapatan dan potongan yang ramah cetak (print-friendly) untuk karyawan.
  - **Ekspor CSV:** Unduh laporan rekapitulasi penggajian bulanan untuk arsip pembukuan keuangan.

---

## 🏗️ Arsitektur & Struktur Kode

Aplikasi ini menggunakan arsitektur **Express.js (Node.js)** di sisi backend dan **Vanilla JavaScript** bermodul IIFE (Immediately Invoked Function Expression) di sisi frontend untuk menjamin kecepatan, kemudahan pemeliharaan, dan skalabilitas.

```text
├── index.html              # Dashboard & UI Utama (Single Page Application)
├── login.html              # Portal Otentikasi Pengguna
├── css/
│   └── main.css            # Stylesheet (Responsive design, Dark Mode, Print Stylesheet)
├── js/
│   ├── app.js              # Router utama, Controller Dashboard, & Event Listeners
│   ├── modules/
│   │   ├── constants.js    # Konfigurasi tarif, aturan golongan, PTKP, dan PPh 21
│   │   ├── salary.js       # Logika kalkulasi payroll (Gaji, BPJS, PPh 21)
│   │   ├── employee.js     # Logika CRUD & Manajemen Karyawan
│   │   ├── payroll.js      # Pemrosesan transaksi gaji bulanan
│   │   ├── slip.js         # Generator & Viewer Slip Gaji (print-ready)
│   │   ├── scenario.js     # Modul simulasi kebijakan dan grafik Chart.js
│   │   └── analytics.js    # Pengolahan statistik dan grafik dashboard
│   └── utils/
│       ├── api.js          # HTTP Client wrapper (fetch API dengan JWT handling)
│       └── formatter.js    # Utility pemformatan Rupiah dan format tanggal
└── backend/
    ├── server.js           # Entry point server Express.js
    ├── db.js               # Pool koneksi database MySQL
    ├── package.json        # Manifest project & dependency backend
    ├── .env                # File konfigurasi environment server (Database & PORT)
    ├── routes/             # Endpoints API (Auth, Employees, Payroll, Dashboard)
    └── update-schema.sql   # Skema inisialisasi database MySQL
```

---

## 🚀 Panduan Menjalankan Aplikasi Secara Lokal

### Persyaratan Sistem
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru)
- [MySQL Server](https://www.mysql.com/)

### 1. Inisialisasi Database
1. Buat database baru di MySQL Server Anda (contoh: `sigaji_db`).
2. Import skema database menggunakan file SQL yang disediakan:
   ```sql
   mysql -u root -p sigaji_db < backend/update-schema.sql
   ```

### 2. Konfigurasi Environment Backend
Di dalam folder `backend/`, buat file `.env` dan sesuaikan dengan kredensial database Anda:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sigaji_db

PORT=3000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=8h
```

### 3. Instalasi Dependency & Menjalankan Aplikasi
Buka terminal/CMD Anda, lalu jalankan perintah berikut:
```bash
# Masuk ke direktori backend
cd backend

# Install seluruh package library
npm install

# Jalankan server dalam mode pengembangan (development)
npm run dev
```

Server backend akan berjalan di `http://localhost:3000`. Anda sekarang dapat mengakses aplikasi langsung dari browser di `http://localhost:3000/login.html` (atau port lain sesuai konfigurasi).

---

## 🔒 Keamanan & Praktik Terbaik
- **JSON Web Token (JWT):** Otentikasi dan otorisasi API terenkripsi untuk mengamankan data karyawan yang sensitif.
- **Double Defense Validation:** Pengamanan data input di sisi frontend dan backend untuk mencegah anomali data.
- **Environment Isolation:** Kredensial penting (database & JWT secret) disimpan terpisah menggunakan file `.env` dan diabaikan dari pelacakan repositori via `.gitignore`.
