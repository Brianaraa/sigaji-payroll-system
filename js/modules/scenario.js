/**
 * MODULE: scenario.js
 * ============================================================
 * Modul "What-If Scenario Analysis" — Simulasi dampak kebijakan gaji.
 *
 * Fitur ini memungkinkan pengguna (misal: manajer HR, analis data)
 * untuk bertanya: "Apa yang terjadi jika kita ubah kebijakan ini?"
 * tanpa harus mengubah data asli yang tersimpan.
 *
 * Cara kerja:
 *   1. Pengguna mengatur parameter kebijakan via slider/input.
 *   2. Modul ini mengambil data karyawan dari Storage.
 *   3. Mengkloning CONSTANTS dan memodifikasinya sesuai parameter.
 *   4. Menjalankan SalaryCalculator dengan konstanta baru di memori.
 *   5. Membandingkan hasil "Before" vs "After" secara visual.
 *   6. Data asli di Storage TIDAK PERNAH berubah.
 *
 * Dependensi:
 *   - Chart.js         (CDN)
 *   - SalaryCalculator (js/modules/salary.js)
 *   - Storage          (js/utils/storage.js)
 *   - Formatter        (js/utils/formatter.js)
 *   - CONSTANTS        (js/modules/constants.js)
 * ============================================================
 */

const ScenarioModule = (() => {

  // Instance Chart.js untuk halaman skenario
  let _scenarioChart = null;

  // ──────────────────────────────────────────
  // PRIVATE: Kalkulasi Skenario
  // ──────────────────────────────────────────

  /**
   * Membaca semua parameter dari form UI skenario.
   * @returns {Object} Parameter kebijakan yang dipilih pengguna
   */
  function _readParams() {
    return {
      kenaikanGajiPersen:     parseFloat(document.getElementById("sc-kenaikan-gaji")?.value    || 0) / 100,
      kenaikanBpjsPersen:     parseFloat(document.getElementById("sc-kenaikan-bpjs")?.value    || 0) / 100,
      kenaikanMakanRp:        parseInt  (document.getElementById("sc-tunjangan-makan")?.value  || 0),
      kenaikanTransportRp:    parseInt  (document.getElementById("sc-tunjangan-transport")?.value || 0),
      tambahanLembur:         parseFloat(document.getElementById("sc-tambahan-lembur")?.value  || 0),
    };
  }

  /**
   * Menjalankan kalkulasi gaji dengan set parameter "Before" (kondisi saat ini)
   * atau "After" (kondisi setelah perubahan kebijakan).
   *
   * PENTING: Fungsi ini membuat salinan konstanta yang dimodifikasi sementara,
   * bukan mengubah CONSTANTS asli yang di-freeze. Ini memastikan data asli
   * di aplikasi tidak berubah sama sekali.
   *
   * @param {Object[]} karyawanList - Array data karyawan
   * @param {Object}   params       - Parameter kebijakan perubahan
   * @param {boolean}  isAfter      - True untuk mode After, False untuk Before
   * @returns {{ totalGajiBersih: number, totalPotongan: number, rataRata: number }}
   */
  function _runCalculation(karyawanList, params, isAfter = false) {
    // Kloning konstanta secara dalam (deep copy)
    const tempConstants = {
      ...CONSTANTS,
      GAJI_POKOK:        { ...CONSTANTS.GAJI_POKOK },
      MULTIPLIER_STATUS: { ...CONSTANTS.MULTIPLIER_STATUS },
    };

    // Terapkan perubahan kebijakan jika mode "After"
    if (isAfter) {
      // Naikkan semua gaji pokok berdasarkan persentase yang dipilih
      for (const golongan in tempConstants.GAJI_POKOK) {
        tempConstants.GAJI_POKOK[golongan] = Math.round(
          CONSTANTS.GAJI_POKOK[golongan] * (1 + params.kenaikanGajiPersen)
        );
      }
      // Naikkan tarif BPJS Ketenagakerjaan
      tempConstants.BPJS_KETENAGAKERJAAN_PERSEN =
        CONSTANTS.BPJS_KETENAGAKERJAAN_PERSEN + params.kenaikanBpjsPersen;

      // Tambah tunjangan makan dan transport
      tempConstants.TUNJANGAN_MAKAN      = CONSTANTS.TUNJANGAN_MAKAN      + params.kenaikanMakanRp;
      tempConstants.TUNJANGAN_TRANSPORT  = CONSTANTS.TUNJANGAN_TRANSPORT  + params.kenaikanTransportRp;
    }

    // Jalankan kalkulasi gaji untuk setiap karyawan menggunakan konstanta sementara
    let totalGajiBersih = 0;
    let totalPotongan   = 0;
    let berhasil        = 0;

    karyawanList.forEach(k => {
      try {
        // Override CONSTANTS global sementara (hanya untuk durasi kalkulasi ini)
        const originalConstants = window.CONSTANTS;
        window.CONSTANTS = tempConstants;

        const lembur  = k._defaultLembur  || 0;
        const absensi = k._defaultAbsensi || 0;

        // Tambahkan jam lembur jika ada parameter tambahan
        const lemburTotal  = Math.min(lembur + (isAfter ? params.tambahanLembur : 0), 100);
        const hasil        = SalaryCalculator.hitungGajiLengkap(k, lemburTotal, absensi);

        // Kembalikan CONSTANTS ke semula segera setelah kalkulasi
        window.CONSTANTS = originalConstants;

        totalGajiBersih += hasil.gajiBersih;
        totalPotongan   += hasil.totalPotongan;
        berhasil++;
      } catch (e) {
        // Pastikan CONSTANTS dikembalikan meski ada error
        window.CONSTANTS = CONSTANTS;
      }
    });

    return {
      totalGajiBersih,
      totalPotongan,
      rataRata: berhasil > 0 ? Math.round(totalGajiBersih / berhasil) : 0,
      jumlah:   berhasil,
    };
  }

  // ──────────────────────────────────────────
  // PRIVATE: Render UI
  // ──────────────────────────────────────────

  /**
   * Merender grafik perbandingan Before vs After menggunakan
   * Grouped Bar Chart dari Chart.js.
   */
  function _renderComparisonChart(before, after) {
    if (_scenarioChart) {
      _scenarioChart.destroy();
      _scenarioChart = null;
    }

    const canvas = document.getElementById("chart-scenario");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");

    // Efek Gradient untuk Kondisi Sebelum (Biru Modern)
    const gradBefore = ctx.createLinearGradient(0, 0, 0, 400);
    gradBefore.addColorStop(0, "rgba(59, 130, 246, 0.95)");
    gradBefore.addColorStop(1, "rgba(59, 130, 246, 0.15)");

    // Efek Gradient untuk Kondisi Sesudah (Hijau Zamrud/Emerald)
    const gradAfter = ctx.createLinearGradient(0, 0, 0, 400);
    gradAfter.addColorStop(0, "rgba(16, 185, 129, 0.95)");
    gradAfter.addColorStop(1, "rgba(16, 185, 129, 0.15)");

    _scenarioChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: ["Total Gaji Bersih", "Total Potongan", "Rata-rata per Karyawan"],
        datasets: [
          {
            label:           "Kondisi Saat Ini (Before)",
            data:            [before.totalGajiBersih, before.totalPotongan, before.rataRata],
            backgroundColor: gradBefore,
            borderColor:     "#2563eb",
            borderWidth:     2,
            borderRadius:    8,
            borderSkipped:   false,
            hoverBackgroundColor: "rgba(37, 99, 235, 1)",
            hoverBorderWidth: 3,
            hoverBorderColor: "#1d4ed8",
            barPercentage:   0.85,
            categoryPercentage: 0.8
          },
          {
            label:           "Setelah Kebijakan Baru (After)",
            data:            [after.totalGajiBersih,  after.totalPotongan,  after.rataRata],
            backgroundColor: gradAfter,
            borderColor:     "#059669",
            borderWidth:     2,
            borderRadius:    8,
            borderSkipped:   false,
            hoverBackgroundColor: "rgba(5, 150, 105, 1)",
            hoverBorderWidth: 3,
            hoverBorderColor: "#047857",
            barPercentage:   0.85,
            categoryPercentage: 0.8
          },
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation: {
          duration: 600, // Animasi transisi smooth saat update real-time
          easing: 'easeOutQuart'
        },
        interaction:         { mode: "index", intersect: false },
        plugins: {
          legend: { 
            position: 'top',
            labels: { 
              color: "#64748b", 
              font: { size: 13, family: "'Inter', sans-serif", weight: 500 },
              usePointStyle: true,
              padding: 20
            } 
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            titleFont: { size: 14, family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: { 
              label: ctx => ` ${ctx.dataset.label}: ${Formatter.rupiah(ctx.raw)}` 
            },
          },
        },
        scales: {
          x: { 
            ticks: { color: "#475569", font: { weight: 500, family: "'Inter', sans-serif" } }, 
            grid: { display: false } 
          },
          y: {
            ticks: { 
              color: "#64748b", 
              font: { family: "'Inter', sans-serif" },
              callback: v => Formatter.singkat(v) 
            },
            grid:  { color: "rgba(0,0,0,0.04)", drawBorder: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /**
   * Merender kartu ringkasan dampak kebijakan:
   * Selisih biaya, persentase kenaikan, dan proyeksi dampak tahunan.
   */
  function _renderImpactCards(before, after) {
    const container = document.getElementById("scenario-impact");
    if (!container) return;

    const selisihGaji      = after.totalGajiBersih - before.totalGajiBersih;
    const selisihPotongan  = after.totalPotongan   - before.totalPotongan;
    const persenKenaikan   = before.totalGajiBersih > 0
      ? ((selisihGaji / before.totalGajiBersih) * 100).toFixed(2)
      : 0;
    const proyeksiTahunan  = selisihGaji * 12;

    const kartu = [
      {
        label:   "Tambahan Biaya per Bulan",
        value:   Formatter.rupiah(Math.abs(selisihGaji)),
        sub:     selisihGaji >= 0 ? "🔺 Biaya naik" : "🔻 Biaya turun",
        color:   selisihGaji >= 0 ? "var(--accent-danger)" : "var(--accent-success)",
      },
      {
        label:   "Persentase Perubahan Gaji",
        value:   `${selisihGaji >= 0 ? "+" : ""}${persenKenaikan}%`,
        sub:     "Dari kondisi saat ini",
        color:   selisihGaji >= 0 ? "var(--accent-warning)" : "var(--accent-success)",
      },
      {
        label:   "Proyeksi Dampak Tahunan",
        value:   Formatter.rupiah(Math.abs(proyeksiTahunan)),
        sub:     "Estimasi selisih 12 bulan ke depan",
        color:   "var(--accent-info)",
      },
      {
        label:   "Jumlah Karyawan Terdampak",
        value:   `${after.jumlah} orang`,
        sub:     "Dari total data karyawan aktif",
        color:   "var(--accent-secondary)",
      },
    ];

    container.innerHTML = kartu.map(k => `
      <div class="stat-card" style="--accent-color:${k.color}">
        <div class="stat-label">${k.label}</div>
        <div class="stat-value" style="color:${k.color};font-size:18px">${k.value}</div>
        <div class="stat-sub">${k.sub}</div>
      </div>
    `).join("");
  }

  // ──────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────

  /**
   * Menjalankan simulasi skenario berdasarkan parameter yang diisi pengguna.
   * Dipanggil setiap kali tombol "Jalankan Simulasi" ditekan.
   */
  async function runSimulation(showToast = true) {
    let karyawan = [];
    try {
      const res = await API.employees.getAll();
      // Map field DB ke format yang dipakai SalaryCalculator
      karyawan = (res?.data || []).map(k => ({
        ...k,
        id:     k.nik,
        nama:   k.nama_lengkap,
        status: k.status_pekerjaan,
      }));
    } catch (err) {
      if (showToast) Toast.show('Gagal memuat karyawan: ' + err.message, 'error');
      return;
    }

    if (karyawan.length === 0) {
      if (showToast) Toast.show("Belum ada data karyawan. Tambahkan karyawan terlebih dahulu.", "warning");
      return;
    }

    const params = _readParams();

    // Jalankan kedua skenario
    const before = _runCalculation(karyawan, params, false);
    const after  = _runCalculation(karyawan, params, true);

    // Tampilkan hasil
    _renderImpactCards(before, after);
    _renderComparisonChart(before, after);

    // Tampilkan section hasil (tersembunyi secara default)
    const resultSection = document.getElementById("scenario-result");
    if (resultSection) resultSection.style.display = "block";

    if (showToast) Toast.show(`Simulasi selesai untuk ${karyawan.length} karyawan.`, "success");
  }

  /**
   * Inisialisasi halaman Skenario: pasang event listener pada
   * semua slider agar label nilai update secara real-time.
   */
  function init() {
    // Update label nilai slider secara real-time dan update grafik otomatis
    const sliders = [
      { input: "sc-kenaikan-gaji",       label: "sc-kenaikan-gaji-val",       suffix: "%"   },
      { input: "sc-kenaikan-bpjs",       label: "sc-kenaikan-bpjs-val",       suffix: "%"   },
      { input: "sc-tunjangan-makan",     label: "sc-tunjangan-makan-val",     suffix: " Rp" },
      { input: "sc-tunjangan-transport", label: "sc-tunjangan-transport-val", suffix: " Rp" },
      { input: "sc-tambahan-lembur",     label: "sc-tambahan-lembur-val",     suffix: " jam"},
    ];

    sliders.forEach(({ input, label, suffix }) => {
      const el = document.getElementById(input);
      const lb = document.getElementById(label);
      if (el && lb) {
        lb.textContent = el.value + suffix;
        el.addEventListener("input", () => {
          lb.textContent = el.value + suffix;
          // Debounce runSimulation agar tidak lag saat slider digeser
          if (window.scenarioTimeout) clearTimeout(window.scenarioTimeout);
          window.scenarioTimeout = setTimeout(() => {
            runSimulation(false); // false = jangan tampilkan toast sukses terus menerus
          }, 150);
        });
      }
    });

    document.getElementById("btn-run-scenario")
      ?.addEventListener("click", () => runSimulation(true));

    document.getElementById("btn-reset-scenario")
      ?.addEventListener("click", () => {
        sliders.forEach(({ input, label, suffix }) => {
          const el = document.getElementById(input);
          const lb = document.getElementById(label);
          if (el) { el.value = "0"; if (lb) lb.textContent = "0" + suffix; }
        });
        runSimulation(true);
      });
  }

  /** Dipanggil oleh Router setiap kali halaman Skenario dibuka. */
  function render() {
    // Tidak perlu re-render slider, tapi refresh chart jika ada data baru
    const resultSection = document.getElementById("scenario-result");
    if (resultSection) resultSection.style.display = "none";
  }

  return { init, render, runSimulation };

})();
