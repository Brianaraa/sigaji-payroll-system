/**
 * MODULE: report.js
 * Logika UI untuk laporan penggajian dan export CSV.
 */

const ReportModule = (() => {

  let currentBulan = new Date().getMonth() + 1;
  let currentTahun = new Date().getFullYear();

  function generateLaporan() {
    const bulan = parseInt(document.getElementById("lap-bulan").value);
    const tahun = parseInt(document.getElementById("lap-tahun").value);
    const dept = document.getElementById("lap-dept").value;

    currentBulan = bulan;
    currentTahun = tahun;

    let data = Storage.getPenggajianByBulan(bulan, tahun, dept);

    renderSummary(data, bulan, tahun);
    renderTable(data);
  }

  function renderSummary(data, bulan, tahun) {
    const container = document.getElementById("laporan-summary");
    if (data.length === 0) {
      container.innerHTML = "";
      return;
    }

    const totalGajiBersih = data.reduce((sum, p) => sum + p.gajiBersih, 0);
    const totalTunjangan = data.reduce((sum, p) => sum + p.tunjangan.total, 0);
    const totalPotongan = data.reduce((sum, p) => sum + p.totalPotongan, 0);
    const totalLembur = data.reduce((sum, p) => sum + p.upahLembur, 0);

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
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><div class="empty-icon">▦</div><p>Belum ada data laporan untuk periode ini</p></td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td class="mono">${p.idKaryawan}</td>
        <td><strong>${p.namaKaryawan}</strong></td>
        <td>${p.jabatan}</td>
        <td>${p.departemen}</td>
        <td class="mono">${Formatter.rupiah(p.gajiPokok)}</td>
        <td class="mono">${Formatter.rupiah(p.tunjangan.total)}</td>
        <td class="mono">${p.upahLembur > 0 ? Formatter.rupiah(p.upahLembur) : "-"}</td>
        <td class="mono" style="color:var(--accent-danger)">-${Formatter.rupiah(p.totalPotongan)}</td>
        <td class="mono" style="color:var(--accent-success)"><strong>${Formatter.rupiah(p.gajiBersih)}</strong></td>
      </tr>
    `).join("");

    // Baris total
    const total = data.reduce((acc, p) => ({
      gajiPokok: acc.gajiPokok + p.gajiPokok,
      tunjangan: acc.tunjangan + p.tunjangan.total,
      lembur: acc.lembur + p.upahLembur,
      potongan: acc.potongan + p.totalPotongan,
      bersih: acc.bersih + p.gajiBersih,
    }), { gajiPokok: 0, tunjangan: 0, lembur: 0, potongan: 0, bersih: 0 });

    tbody.innerHTML += `
      <tr style="font-weight:700;background:var(--bg-surface);border-top:2px solid var(--border-light)">
        <td colspan="4" style="color:var(--text-secondary)">TOTAL (${data.length} karyawan)</td>
        <td class="mono">${Formatter.rupiah(total.gajiPokok)}</td>
        <td class="mono">${Formatter.rupiah(total.tunjangan)}</td>
        <td class="mono">${Formatter.rupiah(total.lembur)}</td>
        <td class="mono" style="color:var(--accent-danger)">-${Formatter.rupiah(total.potongan)}</td>
        <td class="mono" style="color:var(--accent-success)">${Formatter.rupiah(total.bersih)}</td>
      </tr>
    `;
  }

  function exportCSV() {
    const bulan = parseInt(document.getElementById("lap-bulan").value);
    const tahun = parseInt(document.getElementById("lap-tahun").value);
    const dept = document.getElementById("lap-dept").value;
    const data = Storage.getPenggajianByBulan(bulan, tahun, dept);

    if (data.length === 0) {
      Toast.show("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const headers = [
      "ID Karyawan", "Nama", "Jabatan", "Golongan", "Status", "Departemen",
      "Gaji Pokok", "T. Transport", "T. Makan", "T. Jabatan", "Upah Lembur",
      "Jam Lembur", "Hari Absensi", "BPJS Kesehatan", "BPJS Ketenagakerjaan",
      "PPh 21", "Potongan Absensi", "Total Potongan", "Gaji Bersih"
    ];

    const rows = data.map(p => [
      p.idKaryawan, p.namaKaryawan, p.jabatan, p.golongan, p.status, p.departemen,
      p.gajiPokok, p.tunjangan.transport, p.tunjangan.makan, p.tunjangan.jabatan,
      p.upahLembur, p.jamLembur, p.hariAbsensi,
      p.bpjs.kesehatan, p.bpjs.ketenagakerjaan, p.pph21.pajakBulanan,
      p.potonganAbsensi, p.totalPotongan, p.gajiBersih
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-gaji-${Formatter.periodeGaji(bulan, tahun).replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show("Laporan berhasil diekspor", "success");
  }

  function init() {
    const bulanSel = document.getElementById("lap-bulan");
    const tahunSel = document.getElementById("lap-tahun");
    const deptSel = document.getElementById("lap-dept");

    CONSTANTS.BULAN.forEach((b, i) => {
      bulanSel.innerHTML += `<option value="${i + 1}" ${i + 1 === currentBulan ? "selected" : ""}>${b}</option>`;
    });
    for (let y = 2023; y <= 2030; y++) {
      tahunSel.innerHTML += `<option value="${y}" ${y === currentTahun ? "selected" : ""}>${y}</option>`;
    }
    CONSTANTS.DEPARTEMEN.forEach(d => {
      deptSel.innerHTML += `<option value="${d}">${d}</option>`;
    });

    document.getElementById("btn-generate-laporan").addEventListener("click", generateLaporan);
    document.getElementById("btn-export-laporan").addEventListener("click", exportCSV);
  }

  return { init, generateLaporan };

})();
