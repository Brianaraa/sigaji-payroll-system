/**
 * MODULE: analytics.js
 * ============================================================
 * Modul visualisasi data analitik menggunakan Chart.js.
 * Data diambil dari backend API (MySQL), bukan localStorage.
 * ============================================================
 */

const AnalyticsModule = (() => {

  const _chartInstances = {};
  let _cachedData = []; // Cache data dari API

  function _destroyChart(id) {
    if (_chartInstances[id]) {
      _chartInstances[id].destroy();
      delete _chartInstances[id];
    }
  }

  // Ambil data dari API payroll bulan ini
  async function _fetchData() {
    try {
      const now   = new Date();
      const bulan = now.getMonth() + 1;
      const tahun = now.getFullYear();
      const res   = await API.payroll.getAll({ bulan, tahun });
      _cachedData = (res?.data || []).map(p => ({
        ...p,
        // Normalisasi field agar grafik bisa membacanya
        gajiBersih:    Number(p.total_gaji_bersih) || 0,
        totalPotongan: Number(p.potongan)           || 0,
        gajiPokok:     Number(p.gaji_pokok)         || 0,
        tunjangan:     { total: Number(p.tunjangan) || 0 },
        upahLembur:    Number(p.jam_lembur) > 0
          ? (() => { try { return SalaryCalculator.hitungLembur(Number(p.gaji_pokok)||0, Number(p.jam_lembur)||0); } catch(_){return 0;} })()
          : 0,
        bulan,
        tahun,
      }));
    } catch (err) {
      _cachedData = [];
      console.warn('[Analytics] Gagal memuat data:', err.message);
    }
  }

  // ──────────────────────────────────────────
  // TREND DATA — ambil 6 bulan terakhir dari API
  // ──────────────────────────────────────────
  async function _getTrendData() {
    try {
      const now   = new Date();
      const bulanMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const bulan = d.getMonth() + 1;
        const tahun = d.getFullYear();
        const key   = `${CONSTANTS.BULAN[bulan - 1]} ${tahun}`;
        try {
          const res = await API.payroll.getAll({ bulan, tahun });
          const rows = res?.data || [];
          bulanMap[key] = {
            totalGaji:     rows.reduce((s, p) => s + (Number(p.total_gaji_bersih) || 0), 0),
            totalPotongan: rows.reduce((s, p) => s + (Number(p.potongan)           || 0), 0),
          };
        } catch(_) {
          bulanMap[key] = { totalGaji: 0, totalPotongan: 0 };
        }
      }
      const keys = Object.keys(bulanMap);
      return {
        labels:        keys,
        totalGaji:     keys.map(k => bulanMap[k].totalGaji),
        totalPotongan: keys.map(k => bulanMap[k].totalPotongan),
      };
    } catch(err) {
      return { labels: [], totalGaji: [], totalPotongan: [] };
    }
  }

  // ──────────────────────────────────────────
  // CHART RENDERERS
  // ──────────────────────────────────────────

  async function _renderTrendChart(canvasId) {
    _destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = await _getTrendData();

    if (data.labels.length === 0 || data.totalGaji.every(v => v === 0)) {
      ctx.parentElement.innerHTML = `<div class="analytics-empty">
        <span>📈</span><p>Hitung gaji karyawan terlebih dahulu untuk melihat tren.</p>
      </div>`;
      return;
    }

    _chartInstances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels:   data.labels,
        datasets: [
          {
            label:           "Total Gaji Bersih",
            data:            data.totalGaji,
            borderColor:     "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.08)",
            borderWidth:     2.5,
            pointBackgroundColor: "#3b82f6",
            pointRadius:     4,
            tension:         0.4,
            fill:            true,
          },
          {
            label:           "Total Potongan",
            data:            data.totalPotongan,
            borderColor:     "#ef4444",
            backgroundColor: "rgba(239,68,68,0.05)",
            borderWidth:     2,
            pointBackgroundColor: "#ef4444",
            pointRadius:     4,
            tension:         0.4,
            fill:            true,
          },
        ],
      },
      options: _getLineChartOptions("Nominal (Rp)"),
    });
  }

  function _renderCompositionChart(canvasId) {
    _destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = _cachedData;
    if (data.length === 0) {
      ctx.parentElement.innerHTML = `<div class="analytics-empty"><span>🍩</span><p>Belum ada data.</p></div>`;
      return;
    }

    const totals = data.reduce((acc, p) => {
      acc.gajiPokok += p.gajiPokok        || 0;
      acc.tunjangan += p.tunjangan?.total  || 0;
      acc.lembur    += p.upahLembur        || 0;
      acc.potongan  += p.totalPotongan     || 0;
      return acc;
    }, { gajiPokok: 0, tunjangan: 0, lembur: 0, potongan: 0 });

    _chartInstances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Gaji Pokok", "Tunjangan", "Upah Lembur", "Total Potongan"],
        datasets: [{
          data: [totals.gajiPokok, totals.tunjangan, totals.lembur, totals.potongan],
          backgroundColor: [
            "rgba(59,130,246,0.8)",
            "rgba(34,197,94,0.8)",
            "rgba(245,158,11,0.8)",
            "rgba(239,68,68,0.8)",
          ],
          borderColor: "#1a1e28",
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8", padding: 16, font: { size: 12 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${Formatter.rupiah(ctx.raw)}` } },
        },
        cutout: "68%",
      },
    });
  }

  function _renderDeptChart(canvasId) {
    _destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = _cachedData;
    if (data.length === 0) {
      ctx.parentElement.innerHTML = `<div class="analytics-empty"><span>📊</span><p>Belum ada data.</p></div>`;
      return;
    }

    const deptMap = {};
    data.forEach(p => {
      const dept = p.departemen || "Lainnya";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
      deptMap[dept].total += p.gajiBersih || 0;
      deptMap[dept].count++;
    });

    const labels = Object.keys(deptMap).sort();
    const values = labels.map(d => Math.round(deptMap[d].total / deptMap[d].count));

    _chartInstances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label:           "Rata-rata Gaji Bersih",
          data:            values,
          backgroundColor: labels.map((_, i) => [
            "rgba(59,130,246,0.75)", "rgba(99,102,241,0.75)",
            "rgba(34,197,94,0.75)", "rgba(245,158,11,0.75)",
            "rgba(239,68,68,0.75)", "rgba(6,182,212,0.75)",
          ][i % 6]),
          borderRadius: 6,
          borderWidth:  0,
        }],
      },
      options: _getBarChartOptions("Rata-rata Gaji Bersih (Rp)"),
    });
  }

  function _renderHistogramChart(canvasId) {
    _destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = _cachedData;
    if (data.length === 0) {
      ctx.parentElement.innerHTML = `<div class="analytics-empty"><span>📉</span><p>Belum ada data.</p></div>`;
      return;
    }

    const bins = [
      { label: "< 2 Jt",     min: 0,          max: 2_000_000  },
      { label: "2 - 4 Jt",   min: 2_000_000,  max: 4_000_000  },
      { label: "4 - 7 Jt",   min: 4_000_000,  max: 7_000_000  },
      { label: "7 - 10 Jt",  min: 7_000_000,  max: 10_000_000 },
      { label: "10 - 15 Jt", min: 10_000_000, max: 15_000_000 },
      { label: "> 15 Jt",    min: 15_000_000, max: Infinity   },
    ];

    const counts = bins.map(bin =>
      data.filter(p => (p.gajiBersih || 0) >= bin.min && (p.gajiBersih || 0) < bin.max).length
    );

    _chartInstances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: bins.map(b => b.label),
        datasets: [{
          label:           "Jumlah Karyawan",
          data:            counts,
          backgroundColor: "rgba(99,102,241,0.7)",
          borderColor:     "rgba(99,102,241,1)",
          borderWidth:     1,
          borderRadius:    4,
        }],
      },
      options: _getBarChartOptions("Jumlah Karyawan"),
    });
  }

  // ──────────────────────────────────────────
  // CHART OPTIONS FACTORIES
  // ──────────────────────────────────────────

  function _getLineChartOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#94a3b8", font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Formatter.rupiah(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: "#4b5563" }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: {
          ticks: { color: "#4b5563", callback: v => Formatter.singkat(v) },
          grid:  { color: "rgba(255,255,255,0.04)" },
          title: { display: true, text: yLabel, color: "#4b5563", font: { size: 11 } },
        },
      },
    };
  }

  function _getBarChartOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Formatter.angka(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: "#4b5563" }, grid: { display: false } },
        y: {
          ticks: { color: "#4b5563", callback: v => Formatter.singkat(v) },
          grid:  { color: "rgba(255,255,255,0.04)" },
          title: { display: true, text: yLabel, color: "#4b5563", font: { size: 11 } },
          beginAtZero: true,
        },
      },
    };
  }

  // ──────────────────────────────────────────
  // STATISTIK DESKRIPTIF
  // ──────────────────────────────────────────

  function _renderStatCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const gajiArr = _cachedData
      .map(p => p.gajiBersih)
      .filter(v => typeof v === "number" && v > 0);

    if (gajiArr.length === 0) {
      container.innerHTML = `<div class="analytics-empty" style="grid-column:1/-1">
        <span>📋</span><p>Belum ada data penggajian untuk dihitung statistiknya.</p>
      </div>`;
      return;
    }

    const stats = Statistics.summary(gajiArr);

    const kartu = [
      { label: "Mean (Rata-rata)",     value: Formatter.rupiah(stats.mean),   icon: "μ",   color: "var(--accent-primary)",   tip: "Rata-rata aritmatika." },
      { label: "Median (Nilai Tengah)", value: Formatter.rupiah(stats.median), icon: "M",   color: "var(--accent-secondary)", tip: "Nilai tengah setelah data diurutkan." },
      { label: "Std Deviasi",           value: Formatter.rupiah(stats.stdDev), icon: "σ",   color: "var(--accent-warning)",   tip: "Ukuran kesenjangan gaji." },
      { label: "Gaji Minimum",          value: Formatter.rupiah(stats.min),   icon: "↓",   color: "var(--accent-danger)",    tip: "Gaji bersih terendah." },
      { label: "Gaji Maksimum",         value: Formatter.rupiah(stats.max),   icon: "↑",   color: "var(--accent-success)",   tip: "Gaji bersih tertinggi." },
      { label: "Persentil P90",         value: Formatter.rupiah(stats.p90),   icon: "P₉₀", color: "var(--accent-info)",      tip: "90% karyawan bergaji di bawah angka ini." },
    ];

    container.innerHTML = kartu.map(k => `
      <div class="stat-desc-card" style="--card-accent:${k.color}" title="${k.tip}">
        <div class="stat-desc-icon">${k.icon}</div>
        <div class="stat-desc-body">
          <div class="stat-desc-label">${k.label}</div>
          <div class="stat-desc-value">${k.value}</div>
        </div>
      </div>
    `).join("");
  }

  // ──────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────

  async function render() {
    // Ambil data dari API dulu, baru render semua grafik
    await _fetchData();
    _renderStatCards("analytics-stat-cards");
    await _renderTrendChart("chart-trend");
    _renderCompositionChart("chart-composition");
    _renderDeptChart("chart-dept");
    _renderHistogramChart("chart-histogram");
  }

  return { render };

})();
