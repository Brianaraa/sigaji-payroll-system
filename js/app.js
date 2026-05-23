/**
 * app.js
 * ============================================================
 * Entry point aplikasi SiGaji.
 * Berisi:
 *   - Router halaman
 *   - Dashboard module
 *   - Toast notification
 *   - Global helper (openModal, closeModal)
 *   - Inisialisasi semua modul
 * ============================================================
 */

// ── MODAL HELPERS ──
function openModal(id) {
  document.getElementById(id).classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
  document.body.style.overflow = "";
}

// Tutup modal kalau klik overlay (bukan konten)
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
});

// ── TOAST ──
const Toast = (() => {
  function show(message, type = "info", duration = 3500) {
    const container = document.getElementById("toast-container");
    const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || "ℹ"}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  return { show };
})();

// ── ROUTER ──
const Router = (() => {
  const pages = ["dashboard", "karyawan", "penggajian", "slip", "laporan"];

  function navigate(pageId) {
    if (!pages.includes(pageId)) return;

    // Update nav
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.page === pageId);
    });

    // Show page
    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === `page-${pageId}`);
    });

    // Refresh konten saat masuk halaman
    if (pageId === "dashboard") DashboardModule.refresh();
    if (pageId === "karyawan") EmployeeModule.render();
    if (pageId === "penggajian") PayrollModule.renderTable();
    if (pageId === "slip") SlipModule.renderList();
  }

  function init() {
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => navigate(item.dataset.page));
    });
    navigate("dashboard");
  }

  return { init, navigate };
})();

// ── DASHBOARD MODULE ──
const DashboardModule = (() => {
  function refresh() {
    const karyawan = Storage.getAllKaryawan();
    const sekarang = new Date();
    const bulan = sekarang.getMonth() + 1;
    const tahun = sekarang.getFullYear();
    const penggajian = Storage.getPenggajianByBulan(bulan, tahun);

    const totalGaji = penggajian.reduce((s, p) => s + p.gajiBersih, 0);
    const totalPotongan = penggajian.reduce((s, p) => s + p.totalPotongan, 0);

    // Stats
    document.getElementById("stats-grid").innerHTML = `
      <div class="stat-card" style="--accent-color:var(--accent-primary)">
        <div class="stat-label">Total Karyawan</div>
        <div class="stat-value">${karyawan.length}</div>
        <div class="stat-sub">Terdaftar</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-success)">
        <div class="stat-label">Sudah Dihitung</div>
        <div class="stat-value">${penggajian.length}</div>
        <div class="stat-sub">${CONSTANTS.BULAN[bulan - 1]} ${tahun}</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-info)">
        <div class="stat-label">Total Gaji Bersih</div>
        <div class="stat-value">${Formatter.singkat(totalGaji)}</div>
        <div class="stat-sub">${Formatter.rupiah(totalGaji)}</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-danger)">
        <div class="stat-label">Total Potongan</div>
        <div class="stat-value">${Formatter.singkat(totalPotongan)}</div>
        <div class="stat-sub">${Formatter.rupiah(totalPotongan)}</div>
      </div>
    `;

    // Departemen summary
    const deptCounts = {};
    karyawan.forEach(k => {
      deptCounts[k.departemen] = (deptCounts[k.departemen] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(deptCounts), 1);
    const deptHTML = Object.entries(deptCounts).length > 0
      ? Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => `
          <div class="dept-row">
            <div class="dept-name">${dept}</div>
            <div class="dept-bar-wrap">
              <div class="dept-bar" style="width:${(count / maxCount * 100).toFixed(0)}%"></div>
            </div>
            <div class="dept-count">${count} org</div>
          </div>
        `).join("")
      : `<div class="empty-state"><p>Belum ada data</p></div>`;

    document.getElementById("dept-summary-list").innerHTML = deptHTML;

    // Recent employees (5 terbaru)
    const recent = [...karyawan]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const recentHTML = recent.length > 0
      ? recent.map(k => `
          <div class="dept-row">
            <div>
              <div class="dept-name">${k.nama}</div>
              <div class="dept-count">${k.jabatan} · ${k.departemen}</div>
            </div>
            <span class="badge badge-${k.status.toLowerCase()}">${k.status}</span>
          </div>
        `).join("")
      : `<div class="empty-state"><p>Belum ada karyawan</p></div>`;

    document.getElementById("recent-employees").innerHTML = recentHTML;
  }

  return { refresh };
})();

// ── STRESS TEST HELPER ──
// Tersedia via console: StressTest.run(n) untuk testing
const StressTest = (() => {
  function run(jumlah = 100) {
    console.time(`StressTest: seed ${jumlah} karyawan`);
    const seeded = Storage.seedDemoData(jumlah);
    console.timeEnd(`StressTest: seed ${jumlah} karyawan`);

    console.time(`StressTest: hitung ${jumlah} gaji`);
    const karyawan = Storage.getAllKaryawan();
    let berhasil = 0, gagal = 0;
    karyawan.forEach(k => {
      try {
        const jamLembur = Math.floor(Math.random() * 40);
        const hariAbsensi = Math.floor(Math.random() * 5);
        const hasil = SalaryCalculator.hitungGajiLengkap(k, jamLembur, hariAbsensi);
        Storage.savePenggajian({
          ...hasil,
          bulan: new Date().getMonth() + 1,
          tahun: new Date().getFullYear(),
        });
        berhasil++;
      } catch (e) {
        gagal++;
        console.error("Gagal:", k.id, e.message);
      }
    });
    console.timeEnd(`StressTest: hitung ${jumlah} gaji`);
    console.log(`Hasil: ${berhasil} berhasil, ${gagal} gagal`);

    DashboardModule.refresh();
    EmployeeModule.render();
    PayrollModule.renderTable();
    Toast.show(`Stress test selesai: ${berhasil} karyawan dihitung`, "info");

    return { seeded, berhasil, gagal };
  }

  function clear() {
    Storage.clearAll();
    DashboardModule.refresh();
    EmployeeModule.render();
    PayrollModule.renderTable();
    SlipModule.renderList();
    Toast.show("Semua data berhasil dihapus", "info");
  }

  return { run, clear };
})();

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  EmployeeModule.init();
  PayrollModule.init();
  SlipModule.init();
  ReportModule.init();
  Router.init();

  console.log(
    "%cSiGaji v1.0.0\n%cUntuk stress test: StressTest.run(100)\nUntuk reset: StressTest.clear()",
    "color:#3b82f6;font-size:16px;font-weight:bold",
    "color:#94a3b8;font-size:12px"
  );
});
