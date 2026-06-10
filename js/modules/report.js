/**
 * MODULE: report.js
 * ============================================================
 * Logika UI untuk halaman Laporan Penggajian.
 *
 * Fitur:
 *   - Generate laporan berdasarkan periode bulan/tahun
 *   - Cross-filtering: filter berdasarkan Departemen & Rentang Gaji
 *   - Export ke CSV (siap dibuka di Excel / Google Sheets)
 *   - Export ke JSON (siap diproses di Python / Pandas / Tableau)
 *   - Tampilan tabel ringkasan dengan baris total otomatis
 *
 * Dependensi:
 *   - Storage   (js/utils/storage.js)
 *   - Formatter (js/utils/formatter.js)
 *   - CONSTANTS (js/modules/constants.js)
 *   - Toast     (js/app.js)
 * ============================================================
 */

const ReportModule = (() => {

  let currentBulan = new Date().getMonth() + 1;
  let currentTahun = new Date().getFullYear();

  async function generateLaporan() {
    const bulan     = parseInt(document.getElementById("lap-bulan").value);
    const tahun     = parseInt(document.getElementById("lap-tahun").value);
    const dept      = document.getElementById("lap-dept").value;
    const gajiMin   = parseInt(document.getElementById("lap-gaji-min")?.value || 0);
    const gajiMax   = parseInt(document.getElementById("lap-gaji-max")?.value || 999_999_999);

    currentBulan = bulan;
    currentTahun = tahun;

    let data = [];
    try {
      const params = { bulan, tahun };
      if (dept) params.departemen = dept;
      const res = await API.payroll.getAll(params);
      data = res?.data || [];
    } catch (err) {
      Toast.show('Gagal memuat laporan: ' + err.message, 'error');
      return;
    }

    // Cross-filter berdasarkan rentang gaji bersih
    if (gajiMin > 0 || gajiMax < 999_999_999) {
      data = data.filter(p => (p.total_gaji_bersih || 0) >= gajiMin && (p.total_gaji_bersih || 0) <= gajiMax);
    }

    renderSummary(data, bulan, tahun);
    renderTable(data);
  }

  function renderSummary(data, bulan, tahun) {
    const container = document.getElementById("laporan-summary");
    if (data.length === 0) {
      container.innerHTML = "";
      return;
    }

    const totalGajiBersih = data.reduce((sum, p) => sum + (p.total_gaji_bersih || 0), 0);
    const totalTunjangan  = data.reduce((sum, p) => sum + (p.tunjangan || 0), 0);
    const totalPotongan   = data.reduce((sum, p) => sum + (p.potongan || 0), 0);
    const totalLembur     = 0; // tidak disimpan terpisah di DB ringkasan

    container.innerHTML = `
      <div class="stat-card" style="--accent-color:var(--accent-primary)">
        <div class="stat-label">Total Karyawan</div>
        <div class="stat-value">${data.length}</div>
        <div class="stat-sub">${Formatter.periodeGaji(bulan, tahun)}</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-success)">
        <div class="stat-label">Total Gaji Bersih</div>
        <div class="stat-value">${Formatter.singkat(totalGajiBersih)}</div>
        <div class="stat-sub">${Formatter.rupiah(totalGajiBersih)}</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-info)">
        <div class="stat-label">Total Tunjangan</div>
        <div class="stat-value">${Formatter.singkat(totalTunjangan)}</div>
        <div class="stat-sub">${Formatter.rupiah(totalTunjangan)}</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-warning)">
        <div class="stat-label">Total Lembur</div>
        <div class="stat-value">${Formatter.singkat(totalLembur)}</div>
        <div class="stat-sub">${Formatter.rupiah(totalLembur)}</div>
      </div>
      <div class="stat-card" style="--accent-color:var(--accent-danger)">
        <div class="stat-label">Total Potongan</div>
        <div class="stat-value">${Formatter.singkat(totalPotongan)}</div>
        <div class="stat-sub">${Formatter.rupiah(totalPotongan)}</div>
      </div>
    `;
  }

  function renderTable(data) {
    const tbody = document.getElementById("tbody-laporan");

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><div class="empty-icon">▦</div><p>Belum ada data laporan untuk periode ini</p></td></tr>`;
      return;
    }

    function avatarClass(nama) {
      let sum = 0;
      for (let i = 0; i < (nama || '').length; i++) sum += nama.charCodeAt(i);
      return 'av-' + (sum % 8);
    }

    tbody.innerHTML = data.map(p => {
      const nama     = p.nama_lengkap || '';
      const initials = nama ? nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
      const avColor  = avatarClass(nama);
      return `
        <tr>
          <td>
            <div class="employee-cell">
              <div class="avatar ${avColor}">${initials}</div>
              <div class="employee-info">
                <div class="employee-name">${nama}</div>
                <div class="employee-role">${p.jabatan || ''}</div>
              </div>
            </div>
          </td>
          <td>${p.departemen || ''}</td>
          <td class="mono">${Formatter.rupiah(p.gaji_pokok || 0)}</td>
          <td class="mono">${Formatter.rupiah(p.tunjangan || 0)}</td>
          <td class="mono">–</td>
          <td class="mono" style="color:var(--danger)">-${Formatter.rupiah(p.potongan || 0)}</td>
          <td class="mono" style="color:var(--success);font-weight:700">${Formatter.rupiah(p.total_gaji_bersih || 0)}</td>
        </tr>
      `;
    }).join("");

    // Baris total
    const total = data.reduce((acc, p) => ({
      gajiPokok: acc.gajiPokok + (p.gaji_pokok || 0),
      tunjangan: acc.tunjangan + (p.tunjangan || 0),
      potongan:  acc.potongan  + (p.potongan  || 0),
      bersih:    acc.bersih    + (p.total_gaji_bersih || 0),
    }), { gajiPokok: 0, tunjangan: 0, potongan: 0, bersih: 0 });

    tbody.innerHTML += `
      <tr style="font-weight:800;background:var(--bg-app);border-top:2px solid var(--border)">
        <td colspan="2" style="color:var(--text-secondary);font-size:12px">TOTAL — ${data.length} karyawan</td>
        <td class="mono">${Formatter.rupiah(total.gajiPokok)}</td>
        <td class="mono">${Formatter.rupiah(total.tunjangan)}</td>
        <td class="mono">–</td>
        <td class="mono" style="color:var(--danger)">-${Formatter.rupiah(total.potongan)}</td>
        <td class="mono" style="color:var(--success)">${Formatter.rupiah(total.bersih)}</td>
      </tr>
    `;
  }

  /**
   * Mengekspor data laporan ke format CSV.
   * CSV menggunakan BOM (\uFEFF) agar karakter Indonesia terbaca benar di Excel.
   */
  async function exportCSV() {
    const bulan = parseInt(document.getElementById("lap-bulan").value);
    const tahun = parseInt(document.getElementById("lap-tahun").value);
    const dept  = document.getElementById("lap-dept").value;

    let data = [];
    try {
      const params = { bulan, tahun };
      if (dept) params.departemen = dept;
      const res = await API.payroll.getAll(params);
      data = res?.data || [];
    } catch (err) {
      Toast.show('Gagal memuat data: ' + err.message, 'error');
      return;
    }

    if (data.length === 0) {
      Toast.show("Tidak ada data untuk diekspor.", "warning");
      return;
    }

    const headers = [
      "NIK", "Nama", "Jabatan", "Departemen", "Status",
      "Gaji Pokok", "Tunjangan", "Potongan", "Pajak",
      "Jam Lembur", "Hari Absensi", "Total Gaji Bersih",
    ];

    const rows = data.map(p => [
      p.nik, p.nama_lengkap, p.jabatan, p.departemen, p.status_pekerjaan,
      p.gaji_pokok, p.tunjangan, p.potongan, p.pajak,
      p.jam_lembur, p.hari_absensi, p.total_gaji_bersih,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(","))
      .join("\n");

    _downloadFile(
      "\uFEFF" + csv,
      `laporan-gaji-${Formatter.periodeGaji(bulan, tahun).replace(" ", "-")}.csv`,
      "text/csv;charset=utf-8;"
    );
    Toast.show(`CSV berhasil diekspor (${data.length} baris).`, "success");
  }

  /**
   * Mengekspor data laporan ke format JSON yang rapi dan terstruktur.
   * Format JSON dapat langsung dibaca oleh Python (pd.read_json),
   * Node.js, Tableau, Power BI, dan alat analisis data lainnya.
   */
  async function exportJSON() {
    const bulan = parseInt(document.getElementById("lap-bulan").value);
    const tahun = parseInt(document.getElementById("lap-tahun").value);
    const dept  = document.getElementById("lap-dept").value;

    let data = [];
    try {
      const params = { bulan, tahun };
      if (dept) params.departemen = dept;
      const res = await API.payroll.getAll(params);
      data = res?.data || [];
    } catch (err) {
      Toast.show('Gagal memuat data: ' + err.message, 'error');
      return;
    }

    if (data.length === 0) {
      Toast.show("Tidak ada data untuk diekspor.", "warning");
      return;
    }

    const output = {
      metadata: {
        aplikasi:   "SiGaji — Sistem Penggajian Karyawan",
        diekspor:   new Date().toISOString(),
        periode:    Formatter.periodeGaji(bulan, tahun),
        departemen: dept || "Semua Departemen",
        totalData:  data.length,
      },
      data: data.map(p => ({
        nik:          p.nik,
        nama:         p.nama_lengkap,
        jabatan:      p.jabatan,
        departemen:   p.departemen,
        status:       p.status_pekerjaan,
        periode:      p.periode_bulan,
        jam_lembur:   p.jam_lembur,
        hari_absensi: p.hari_absensi,
        gaji_pokok:   p.gaji_pokok,
        tunjangan:    p.tunjangan,
        potongan:     p.potongan,
        pajak:        p.pajak,
        gaji_bersih:  p.total_gaji_bersih,
      })),
    };

    _downloadFile(
      JSON.stringify(output, null, 2),
      `laporan-gaji-${Formatter.periodeGaji(bulan, tahun).replace(" ", "-")}.json`,
      "application/json"
    );
    Toast.show(`JSON berhasil diekspor (${data.length} entri).`, "success");
  }

  /**
   * Helper: membuat file blob dan memicu dialog unduhan di browser.
   * @param {string} content  - Isi file sebagai string
   * @param {string} filename - Nama file yang akan diunduh
   * @param {string} mimeType - Tipe MIME file
   */
  function _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function init() {
    const bulanSel = document.getElementById("lap-bulan");
    const tahunSel = document.getElementById("lap-tahun");
    const deptSel  = document.getElementById("lap-dept");

    // Isi dropdown Bulan
    CONSTANTS.BULAN.forEach((b, i) => {
      bulanSel.innerHTML += `<option value="${i + 1}" ${i + 1 === currentBulan ? "selected" : ""}>${b}</option>`;
    });

    // Isi dropdown Tahun
    for (let y = 2023; y <= 2030; y++) {
      tahunSel.innerHTML += `<option value="${y}" ${y === currentTahun ? "selected" : ""}>${y}</option>`;
    }

    // Isi dropdown Departemen
    CONSTANTS.DEPARTEMEN.forEach(d => {
      deptSel.innerHTML += `<option value="${d}">${d}</option>`;
    });

    // Pasang event listener pada tombol-tombol
    document.getElementById("btn-generate-laporan")?.addEventListener("click", generateLaporan);
    document.getElementById("btn-export-laporan")?.addEventListener("click", exportCSV);
    document.getElementById("btn-export-json")?.addEventListener("click", exportJSON);
  }

  return { init, generateLaporan, exportCSV, exportJSON };

})();
