/**
 * UTIL: statistics.js
 * ============================================================
 * Kumpulan fungsi statistik deskriptif murni (pure functions).
 * Tidak memiliki efek samping — hanya menerima array angka
 * dan mengembalikan hasil kalkulasi.
 *
 * Digunakan oleh:
 *   - AnalyticsModule  (menghitung metrik dashboard)
 *   - ScenarioModule   (membandingkan distribusi before/after)
 *
 * Fungsi yang tersedia:
 *   - mean(arr)          → Rata-rata aritmatika
 *   - median(arr)        → Nilai tengah (robust terhadap outlier)
 *   - mode(arr)          → Nilai yang paling sering muncul
 *   - stdDev(arr)        → Simpangan baku (standar deviasi)
 *   - percentile(arr, p) → Nilai persentil ke-p (misal p=90)
 *   - min(arr)           → Nilai minimum
 *   - max(arr)           → Nilai maksimum
 *   - summary(arr)       → Ringkasan semua metrik sekaligus
 * ============================================================
 */

const Statistics = (() => {

  /**
   * Validasi input — pastikan array tidak kosong dan berisi angka.
   * @param {number[]} arr
   * @throws {Error}
   */
  function _validate(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error("Input harus berupa array yang tidak kosong.");
    }
    if (arr.some(v => typeof v !== "number" || isNaN(v))) {
      throw new Error("Semua elemen array harus berupa angka valid.");
    }
  }

  /**
   * Mengurutkan array angka secara ascending (kecil ke besar).
   * Tidak memodifikasi array asli (immutable).
   * @param {number[]} arr
   * @returns {number[]}
   */
  function _sort(arr) {
    return [...arr].sort((a, b) => a - b);
  }

  // ──────────────────────────────────────────
  // 1. MEAN — Rata-rata Aritmatika
  // ──────────────────────────────────────────
  /**
   * Menghitung rata-rata aritmatika dari sebuah array angka.
   * Rumus: Σ(x) / n
   *
   * Catatan: Sensitif terhadap outlier. Selalu bandingkan dengan
   * nilai Median untuk memahami distribusi data secara menyeluruh.
   *
   * @param {number[]} arr
   * @returns {number}
   */
  function mean(arr) {
    _validate(arr);
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }

  // ──────────────────────────────────────────
  // 2. MEDIAN — Nilai Tengah
  // ──────────────────────────────────────────
  /**
   * Menghitung nilai tengah dari sebuah array angka.
   * - Jika jumlah elemen ganjil: ambil elemen tengah.
   * - Jika jumlah elemen genap: rata-rata dua elemen tengah.
   *
   * Keunggulan: Tidak terpengaruh oleh outlier ekstrem
   * (misal gaji Direktur yang jauh lebih besar dari rata-rata).
   *
   * @param {number[]} arr
   * @returns {number}
   */
  function median(arr) {
    _validate(arr);
    const sorted = _sort(arr);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // ──────────────────────────────────────────
  // 3. MODE — Nilai yang Paling Sering Muncul
  // ──────────────────────────────────────────
  /**
   * Menghitung mode (nilai yang paling sering muncul).
   * Jika ada beberapa nilai dengan frekuensi tertinggi yang sama,
   * semua nilai tersebut dikembalikan dalam sebuah array.
   *
   * @param {number[]} arr
   * @returns {number[]} Array mode (bisa lebih dari satu)
   */
  function mode(arr) {
    _validate(arr);

    // Hitung frekuensi kemunculan setiap nilai
    const freq = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    const maxFreq = Math.max(...Object.values(freq));

    // Kembalikan semua nilai yang memiliki frekuensi tertinggi
    return Object.keys(freq)
      .filter(key => freq[key] === maxFreq)
      .map(Number);
  }

  // ──────────────────────────────────────────
  // 4. STANDARD DEVIATION — Simpangan Baku
  // ──────────────────────────────────────────
  /**
   * Menghitung simpangan baku populasi (population standard deviation).
   * Mengukur seberapa jauh variasi data dari nilai rata-ratanya.
   *
   * Interpretasi:
   *   - Std Dev kecil → Gaji antar karyawan relatif seragam/merata
   *   - Std Dev besar → Kesenjangan gaji antar karyawan sangat tinggi
   *
   * Rumus: √( Σ(x - μ)² / n )
   *
   * @param {number[]} arr
   * @returns {number}
   */
  function stdDev(arr) {
    _validate(arr);
    const avg = mean(arr);
    const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / arr.length;
    return Math.sqrt(variance);
  }

  // ──────────────────────────────────────────
  // 5. PERCENTILE — Nilai Persentil ke-P
  // ──────────────────────────────────────────
  /**
   * Menghitung nilai persentil ke-p dari sebuah array.
   * Menggunakan metode interpolasi linear.
   *
   * Contoh penggunaan:
   *   percentile(gajiArr, 90) → "90% karyawan bergaji di bawah angka ini"
   *   percentile(gajiArr, 50) → Sama dengan Median
   *
   * @param {number[]} arr
   * @param {number} p - Persentil (0–100)
   * @returns {number}
   */
  function percentile(arr, p) {
    _validate(arr);
    if (p < 0 || p > 100) throw new Error("Nilai persentil harus antara 0 dan 100.");

    const sorted = _sort(arr);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    // Jika indeks persis bulat, kembalikan nilai langsung
    if (lower === upper) return sorted[lower];

    // Interpolasi linear antara dua elemen terdekat
    const fraction = index - lower;
    return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
  }

  // ──────────────────────────────────────────
  // 6. MIN & MAX
  // ──────────────────────────────────────────
  /**
   * Mengembalikan nilai minimum dari array.
   * @param {number[]} arr
   * @returns {number}
   */
  function min(arr) {
    _validate(arr);
    return Math.min(...arr);
  }

  /**
   * Mengembalikan nilai maksimum dari array.
   * @param {number[]} arr
   * @returns {number}
   */
  function max(arr) {
    _validate(arr);
    return Math.max(...arr);
  }

  // ──────────────────────────────────────────
  // 7. SUMMARY — Ringkasan Lengkap
  // ──────────────────────────────────────────
  /**
   * Menghitung semua metrik statistik deskriptif sekaligus
   * dan mengembalikannya dalam satu objek.
   *
   * @param {number[]} arr
   * @returns {{
   *   count: number, mean: number, median: number,
   *   mode: number[], stdDev: number,
   *   min: number, max: number,
   *   p10: number, p25: number, p75: number, p90: number
   * }}
   */
  function summary(arr) {
    _validate(arr);
    return {
      count:   arr.length,
      mean:    mean(arr),
      median:  median(arr),
      mode:    mode(arr),
      stdDev:  stdDev(arr),
      min:     min(arr),
      max:     max(arr),
      p10:     percentile(arr, 10),
      p25:     percentile(arr, 25),
      p75:     percentile(arr, 75),
      p90:     percentile(arr, 90),
    };
  }

  // ── Public API ──
  return { mean, median, mode, stdDev, percentile, min, max, summary };

})();
