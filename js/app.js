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
  // Daftar semua halaman yang valid
  const pages = ["dashboard", "karyawan", "penggajian", "slip", "laporan", "analitik", "skenario"];

  function navigate(pageId) {
    if (!pages.includes(pageId)) return;

    // Update navigasi aktif
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.page === pageId);
    });

    // Tampilkan halaman yang sesuai
    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === `page-${pageId}`);
    });

    // Panggil refresh/render modul yang sesuai
    if (pageId === "dashboard")  DashboardModule.refresh();
    if (pageId === "karyawan")   EmployeeModule.render();
    if (pageId === "penggajian") PayrollModule.renderTable();
    if (pageId === "slip")       SlipModule.renderList();
    if (pageId === "analitik")   AnalyticsModule.render();
    if (pageId === "skenario")   ScenarioModule.render();
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
  function avatarClass(nama) {
    let sum = 0;
    for (let i = 0; i < (nama || '').length; i++) sum += nama.charCodeAt(i);
    return 'av-' + (sum % 8);
  }

  async function refresh() {
    try {
      const sekarang = new Date();
      const bulan = sekarang.getMonth() + 1;
      const tahun = sekarang.getFullYear();

      // Ambil data dari API secara paralel
      const [empRes, pgRes] = await Promise.all([
        API.employees.getAll(),
        API.payroll.getAll({ bulan, tahun }),
      ]);

      const karyawan   = empRes?.data || [];
      const penggajian = pgRes?.data  || [];

      const totalGaji     = penggajian.reduce((s, p) => s + (p.total_gaji_bersih || 0), 0);
      const totalPotongan = penggajian.reduce((s, p) => s + (p.potongan || 0), 0);

      // Hero Stats
      const elHeroMonth = document.getElementById("hero-month");
      if (elHeroMonth) {
        elHeroMonth.textContent = `${CONSTANTS.BULAN[bulan - 1]} ${tahun}`;
        document.getElementById("banner-total-gaji").textContent = Formatter.rupiah(totalGaji);
        document.getElementById("banner-total-potongan").textContent = Formatter.rupiah(totalPotongan);
        document.getElementById("banner-jumlah-karyawan").textContent = karyawan.length.toString();
      }

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
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);

      const recentHTML = recent.length > 0
        ? recent.map(k => {
            const nama     = k.nama_lengkap || '';
            const initials = nama ? nama.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?';
            const avColor  = avatarClass(nama);
            const status   = k.status_pekerjaan || '-';
            return `
              <div class="dept-row">
                <div class="employee-cell" style="flex:1">
                  <div class="avatar ${avColor}" style="width:30px;height:30px;font-size:11px">${initials}</div>
                  <div>
                    <div class="dept-name">${nama}</div>
                    <div class="dept-count">${k.jabatan || ''} · ${k.departemen || ''}</div>
                  </div>
                </div>
                <span class="badge badge-${status.toLowerCase()}">${status}</span>
              </div>`;
          }).join("")
        : `<div class="empty-state"><p>Belum ada karyawan</p></div>`;

      document.getElementById("recent-employees").innerHTML = recentHTML;
    } catch (err) {
      console.error('[Dashboard] refresh error:', err);
    }
  }

  return { refresh };
})();

// ── STRESS TEST HELPER (dinonaktifkan di mode DB) ──
const StressTest = (() => {
  function run() {
    Toast.show('Stress test tidak tersedia di mode database.', 'warning');
  }
  function clear() {
    Toast.show('Reset data: hapus manual melalui phpMyAdmin.', 'info');
  }
  return { run, clear };
})();

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  EmployeeModule.init();
  PayrollModule.init();
  SlipModule.init();
  ReportModule.init();
  ScenarioModule.init(); // Inisialisasi slider dan event listener halaman skenario
  Router.init();

  console.log(
    "%cSiGaji v2.0.0\n%cAnalitik: klik menu 'Analitik'\nStress test: StressTest.run(100)\nReset: StressTest.clear()",
    "color:#3b82f6;font-size:16px;font-weight:bold",
    "color:#94a3b8;font-size:12px"
  );
});
