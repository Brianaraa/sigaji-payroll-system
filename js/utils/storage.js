/**
 * UTIL: storage.js
 * ============================================================
 * Abstraksi layer untuk penyimpanan data berbasis Web Storage API
 * (localStorage). Memisahkan semua operasi I/O dari logika bisnis
 * agar mudah diuji, di-mock, dan suatu saat diganti dengan backend
 * API sungguhan tanpa mengubah kode modul lainnya.
 *
 * Modul ini bertanggung jawab atas dua entitas data:
 *   - Karyawan   → CRUD data karyawan
 *   - Penggajian → CRUD data slip gaji bulanan
 *
 * Serta menyediakan generator data sintetis realistis untuk demo
 * dan keperluan stress/load testing.
 * ============================================================
 */

const Storage = (() => {

  // Kunci unik untuk namespace data di localStorage
  // Menggunakan prefix "sigaji_" untuk menghindari konflik dengan
  // aplikasi web lain yang mungkin berjalan di port yang sama.
  const KEYS = {
    KARYAWAN:   "sigaji_karyawan",
    PENGGAJIAN: "sigaji_penggajian",
  };

  // ──────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────

  /**
   * Membaca dan mem-parse data JSON dari localStorage.
   * Mengembalikan array kosong jika data tidak ada atau gagal di-parse.
   * @param {string} key - Kunci localStorage
   * @returns {Array}
   */
  function _get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("[Storage] Gagal membaca data:", e);
      return [];
    }
  }

  /**
   * Meng-serialize data ke JSON dan menyimpannya ke localStorage.
   * Mengembalikan false jika gagal (misal: kuota penuh).
   * @param {string} key  - Kunci localStorage
   * @param {Array}  data - Data yang akan disimpan
   * @returns {boolean}
   */
  function _set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      // QuotaExceededError adalah crash point yang valid untuk Stress Testing
      console.error("[Storage] Gagal menyimpan data (mungkin kuota penuh):", e);
      throw e; // Re-throw agar modul pemanggil bisa menangani error ini
    }
  }

  // ──────────────────────────────────────────
  // KARYAWAN — CRUD Operations
  // ──────────────────────────────────────────

  /** Mengambil semua data karyawan. */
  function getAllKaryawan() {
    return _get(KEYS.KARYAWAN);
  }

  /** Mencari data karyawan berdasarkan ID uniknya. */
  function getKaryawanById(id) {
    return getAllKaryawan().find(k => k.id === id) || null;
  }

  /**
   * Menyimpan data karyawan (Create atau Update).
   * Jika ID sudah ada → Update (merge data lama & baru).
   * Jika ID belum ada → Create (push sebagai entri baru).
   * @param {Object} karyawan
   * @returns {boolean}
   */
  function saveKaryawan(karyawan) {
    const data = getAllKaryawan();
    const idx  = data.findIndex(k => k.id === karyawan.id);

    if (idx >= 0) {
      // Update: gabungkan data lama dengan data baru
      data[idx] = { ...data[idx], ...karyawan };
    } else {
      // Create: catat waktu pertama kali data dibuat
      karyawan.createdAt = new Date().toISOString();
      data.push(karyawan);
    }
    return _set(KEYS.KARYAWAN, data);
  }

  /**
   * Menghapus data karyawan berdasarkan ID.
   * @param {string} id
   * @returns {boolean}
   */
  function deleteKaryawan(id) {
    const data = getAllKaryawan().filter(k => k.id !== id);
    return _set(KEYS.KARYAWAN, data);
  }

  /**
   * Mengecek apakah sebuah ID karyawan sudah digunakan.
   * Parameter excludeId digunakan saat mode Edit agar ID milik
   * karyawan itu sendiri tidak dianggap duplikat.
   * @param {string} id
   * @param {string|null} excludeId
   * @returns {boolean}
   */
  function isIdExists(id, excludeId = null) {
    return getAllKaryawan().some(k => k.id === id && k.id !== excludeId);
  }

  // ──────────────────────────────────────────
  // PENGGAJIAN — CRUD Operations
  // ──────────────────────────────────────────

  /** Mengambil semua data penggajian. */
  function getAllPenggajian() {
    return _get(KEYS.PENGGAJIAN);
  }

  /**
   * Mencari satu slip gaji berdasarkan kombinasi unik:
   * ID Karyawan + Bulan + Tahun.
   */
  function getPenggajian(idKaryawan, bulan, tahun) {
    return getAllPenggajian().find(
      p => p.idKaryawan === idKaryawan && p.bulan === bulan && p.tahun === tahun
    ) || null;
  }

  /**
   * Menyimpan data penggajian (Create atau Update).
   * Kunci unik: kombinasi idKaryawan + bulan + tahun.
   */
  function savePenggajian(data) {
    const all = getAllPenggajian();
    const key = p => `${p.idKaryawan}_${p.bulan}_${p.tahun}`;
    const idx = all.findIndex(p => key(p) === key(data));

    if (idx >= 0) {
      all[idx] = data;
    } else {
      all.push(data);
    }
    return _set(KEYS.PENGGAJIAN, all);
  }

  /**
   * Mengambil data penggajian berdasarkan bulan, tahun,
   * dan opsional departemen (untuk filter laporan).
   */
  function getPenggajianByBulan(bulan, tahun, departemen = "") {
    let data = getAllPenggajian().filter(
      p => p.bulan === bulan && p.tahun === tahun
    );
    if (departemen) {
      data = data.filter(p => p.departemen === departemen);
    }
    return data;
  }

  /** Menghapus SEMUA data dari localStorage (reset aplikasi). */
  function clearAll() {
    localStorage.removeItem(KEYS.KARYAWAN);
    localStorage.removeItem(KEYS.PENGGAJIAN);
  }

  // ──────────────────────────────────────────
  // SEED DATA — Generator Data Sintetis Realistis
  // ──────────────────────────────────────────

  /**
   * Menghasilkan angka acak berdistribusi NORMAL menggunakan
   * algoritma Box-Muller Transform.
   *
   * Mengapa Box-Muller?
   * Distribusi normal jauh lebih realistis daripada distribusi seragam
   * (Math.random). Di dunia nyata, mayoritas karyawan lembur pada rentang
   * "normal" (misal 10-20 jam), sangat sedikit yang 0 jam atau 100 jam.
   * Box-Muller menghasilkan pola distribusi seperti itu.
   *
   * @param {number} mean   - Nilai rata-rata yang diinginkan
   * @param {number} stdDev - Simpangan baku (seberapa tersebar datanya)
   * @param {number} min    - Batas bawah (clamp)
   * @param {number} max    - Batas atas (clamp)
   * @returns {number}
   */
  function _randomNormal(mean, stdDev, min = -Infinity, max = Infinity) {
    let result;
    do {
      const u1 = Math.random();
      const u2 = Math.random();
      // Rumus Box-Muller: transformasi dari distribusi seragam ke distribusi normal
      const z  = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      result = mean + z * stdDev;
    } while (result < min || result > max); // Reject sampling jika di luar batas
    return result;
  }

  /**
   * Memilih satu elemen dari array berdasarkan distribusi bobot (weighted random).
   *
   * Contoh: items = ["Tetap", "Kontrak", "Magang"], weights = [55, 30, 15]
   * → "Tetap" akan terpilih 55% dari waktu.
   *
   * @param {Array}    items   - Daftar elemen yang bisa dipilih
   * @param {number[]} weights - Bobot untuk setiap elemen
   * @returns {*}
   */
  function _weightedRandom(items, weights) {
    const total  = weights.reduce((a, b) => a + b, 0);
    let   cursor = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      cursor -= weights[i];
      if (cursor <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /**
   * Menghasilkan dataset karyawan demo yang REALISTIS.
   *
   * Distribusi yang diterapkan:
   * ┌─────────────────┬────────────────────────────────────────────────┐
   * │ Dimensi         │ Distribusi                                     │
   * ├─────────────────┼────────────────────────────────────────────────┤
   * │ Jabatan         │ Mayoritas Staff (55%), Supervisor (20%),       │
   * │                 │ Manajer (10%), Magang (10%), Direktur (5%)     │
   * │ Status          │ Tetap (55%), Kontrak (30%), Magang (15%)       │
   * │ Departemen      │ Ops/Produksi (55%), IT (15%), Keuangan (12%), │
   * │                 │ Marketing (10%), HRD (8%)                      │
   * │ Jam Lembur      │ Normal: μ=15 jam, σ=10 jam, [0, 100]          │
   * │ Hari Absensi    │ Normal: μ=2 hari, σ=1.5 hari, [0, 26]        │
   * └─────────────────┴────────────────────────────────────────────────┘
   *
   * @param {number} jumlah - Jumlah entri karyawan yang akan dibuat
   * @returns {number}       - Jumlah entri yang berhasil disimpan
   */
  function seedDemoData(jumlah = 20) {

    // Kumpulan nama untuk membuat data lebih manusiawi
    const namaDepan = [
      "Andi", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Galih",
      "Hana", "Irfan", "Joko", "Kartika", "Lina", "Maulana", "Novi",
      "Oki", "Putri", "Reza", "Sari", "Teguh", "Utami", "Vino",
      "Wati", "Yoga", "Zahra", "Arif", "Bella", "Cahya", "Dimas",
      "Elsa", "Farhan", "Gita", "Hendri", "Indah", "Jefri", "Kiki",
    ];
    const namaBelakang = [
      "Pratama", "Santoso", "Wulandari", "Rahayu", "Kusuma", "Hidayat",
      "Nugroho", "Sulistyo", "Purnama", "Setiawan", "Wijaya", "Hartono",
      "Kurniawan", "Permana", "Susanto", "Lestari", "Firmansyah", "Saputra",
      "Hadiyanto", "Prasetyo", "Gunawan", "Basuki", "Wahyudi", "Iskandar",
    ];

    // Konfigurasi jabatan dengan golongan dan bobot probabilitas yang realistis
    const jabatanConfig = [
      { jabatan: "Staff Junior",  golongan: "I",   bobot: 25 },
      { jabatan: "Staff Junior",  golongan: "II",  bobot: 15 },
      { jabatan: "Staff Senior",  golongan: "II",  bobot: 10 },
      { jabatan: "Staff Senior",  golongan: "III", bobot: 10 },
      { jabatan: "Supervisor",    golongan: "III", bobot: 12 },
      { jabatan: "Supervisor",    golongan: "IV",  bobot: 8  },
      { jabatan: "Magang",        golongan: "I",   bobot: 10 },
      { jabatan: "Manajer",       golongan: "IV",  bobot: 7  },
      { jabatan: "Direktur",      golongan: "V",   bobot: 3  },
    ];

    const statusList  = ["Tetap",  "Kontrak", "Magang"];
    const statusBobot = [55,       30,        15      ];

    const deptList  = ["Operasional", "Produksi", "IT", "Keuangan", "HRD", "Marketing"];
    const deptBobot = [28,            25,         15,   12,         10,    10          ];

    const ptkps = Object.keys(CONSTANTS.PTKP);

    // Rentang tanggal join: acak dalam 3 tahun terakhir
    const tiga_tahun_ms = 3 * 365 * 24 * 3600 * 1000;

    const karyawanList = [];

    for (let i = 1; i <= jumlah; i++) {
      const jobConfig   = _weightedRandom(jabatanConfig, jabatanConfig.map(j => j.bobot));
      const depan       = namaDepan  [Math.floor(Math.random() * namaDepan.length)];
      const belakang    = namaBelakang[Math.floor(Math.random() * namaBelakang.length)];
      const joinDate    = new Date(Date.now() - Math.random() * tiga_tahun_ms);

      // Jam lembur & absensi dengan distribusi normal agar lebih realistis
      const defaultLembur  = Math.round(
        _randomNormal(15, 10, 0, CONSTANTS.MAX_JAM_LEMBUR) * 2
      ) / 2; // Dibulatkan ke kelipatan 0.5

      const defaultAbsensi = Math.round(
        _randomNormal(2, 1.5, 0, CONSTANTS.MAX_HARI_ABSENSI)
      );

      karyawanList.push({
        id:         `KRY-${String(i).padStart(4, "0")}`,
        nama:       `${depan} ${belakang}`,
        jabatan:    jobConfig.jabatan,
        golongan:   jobConfig.golongan,
        status:     _weightedRandom(statusList, statusBobot),
        departemen: _weightedRandom(deptList,   deptBobot),
        ptkp:       ptkps[Math.floor(Math.random() * ptkps.length)],
        npwp:       Math.random() > 0.3 ? `${Math.floor(Math.random() * 9e14 + 1e14)}` : "",
        createdAt:  joinDate.toISOString(),
        // Metadata untuk Analytics (jam lembur & absensi historis default)
        _defaultLembur:  defaultLembur,
        _defaultAbsensi: defaultAbsensi,
      });
    }

    _set(KEYS.KARYAWAN, karyawanList);
    return karyawanList.length;
  }

  // ── Public API ──
  return {
    getAllKaryawan,
    getKaryawanById,
    saveKaryawan,
    deleteKaryawan,
    isIdExists,
    getAllPenggajian,
    getPenggajian,
    savePenggajian,
    getPenggajianByBulan,
    clearAll,
    seedDemoData,
    KEYS,
  };

})();
