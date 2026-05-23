/**
 * MODULE: slip.js
 * Logika UI untuk tampilan dan cetak slip gaji.
 */

const SlipModule = (() => {

  let currentBulan = new Date().getMonth() + 1;
  let currentTahun = new Date().getFullYear();

  function renderList() {
    const bulan = parseInt(document.getElementById("slip-bulan").value);
    const tahun = parseInt(document.getElementById("slip-tahun").value);
    const keyword = document.getElementById("slip-search").value.toLowerCase();

    currentBulan = bulan;
    currentTahun = tahun;

    let data = Storage.getPenggajianByBulan(bulan, tahun);

    if (keyword) {
      data = data.filter(p =>
        p.namaKaryawan.toLowerCase().includes(keyword) ||
        p.idKaryawan.toLowerCase().includes(keyword)
      );
    }

    const container = document.getElementById("slip-list");

    if (data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">▣</div>
          <p>Belum ada data gaji untuk periode ini. Hitung gaji di menu "Hitung Gaji" terlebih dahulu.</p>
        </div>`;
      return;
    }

    container.innerHTML = data.map(p => `
      <div class="slip-card" onclick="SlipModule.openDetail('${p.idKaryawan}', ${bulan}, ${tahun})">
        <div class="slip-card-info">
          <div class="slip-card-name">${p.namaKaryawan}</div>
          <div class="slip-card-meta">${p.idKaryawan} · ${p.jabatan} · ${p.departemen}</div>
        </div>
        <div class="slip-card-gaji">${Formatter.rupiah(p.gajiBersih)}</div>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); SlipModule.openDetail('${p.idKaryawan}', ${bulan}, ${tahun})">Lihat Slip</button>
      </div>
    `).join("");
  }

  function openDetail(idKaryawan, bulan, tahun) {
    const pg = Storage.getPenggajian(idKaryawan, bulan, tahun);
    if (!pg) {
      Toast.show("Data slip tidak ditemukan", "error");
      return;
    }

    const content = buildSlipHTML(pg, bulan, tahun);
    document.getElementById("slip-detail-content").innerHTML = content;
    openModal("modal-slip");
  }

  function buildSlipHTML(pg, bulan, tahun) {
    return `
      <div class="slip-detail-header">
        <div class="slip-company">PT. MAJU BERSAMA INDONESIA</div>
        <div class="slip-title">SLIP GAJI KARYAWAN</div>
        <div class="slip-period">Periode: ${Formatter.periodeGaji(bulan, tahun)}</div>
        <div class="slip-period" style="margin-top:4px;font-size:11px;color:var(--text-muted)">Dicetak: ${Formatter.tanggal(new Date().toISOString())}</div>
      </div>

      <div class="slip-employee-info">
        <div class="slip-field">
          <span class="slip-field-label">ID Karyawan</span>
          <span class="slip-field-value">${pg.idKaryawan}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Nama</span>
          <span class="slip-field-value">${pg.namaKaryawan}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Jabatan</span>
          <span class="slip-field-value">${pg.jabatan}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Golongan</span>
          <span class="slip-field-value">Golongan ${pg.golongan}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Status</span>
          <span class="slip-field-value">${pg.status}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Departemen</span>
          <span class="slip-field-value">${pg.departemen}</span>
        </div>
      </div>

      <table class="slip-table">
        <!-- PENGHASILAN -->
        <tr class="slip-section-title"><td colspan="2">▸ PENGHASILAN</td></tr>
        <tr>
          <td>Gaji Pokok</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.gajiPokok)}</td>
        </tr>
        <tr>
          <td>Tunjangan Transport</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.tunjangan.transport)}</td>
        </tr>
        <tr>
          <td>Tunjangan Makan</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.tunjangan.makan)}</td>
        </tr>
        <tr>
          <td>Tunjangan Jabatan</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.tunjangan.jabatan)}</td>
        </tr>
        ${pg.upahLembur > 0 ? `
        <tr>
          <td>Upah Lembur (${pg.jamLembur} jam)</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.upahLembur)}</td>
        </tr>` : ""}
        <tr style="font-weight:600;border-top:1px solid var(--border)">
          <td>Total Penghasilan Bruto</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.penghasilanBruto)}</td>
        </tr>

        <tr><td colspan="2" style="padding:8px 0"></td></tr>

        <!-- POTONGAN -->
        <tr class="slip-section-title"><td colspan="2">▸ POTONGAN</td></tr>
        <tr>
          <td>BPJS Kesehatan (1%)</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.bpjs.kesehatan)}</td>
        </tr>
        ${pg.bpjs.ketenagakerjaan > 0 ? `
        <tr>
          <td>BPJS Ketenagakerjaan (2%)</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.bpjs.ketenagakerjaan)}</td>
        </tr>` : ""}
        <tr>
          <td>PPh 21 / Bulan</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.pph21.pajakBulanan)}</td>
        </tr>
        ${pg.potonganAbsensi > 0 ? `
        <tr>
          <td>Potongan Absensi (${pg.hariAbsensi} hari)</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.potonganAbsensi)}</td>
        </tr>` : ""}
        <tr style="font-weight:600;border-top:1px solid var(--border)">
          <td>Total Potongan</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.totalPotongan)}</td>
        </tr>
      </table>

      <!-- Detail PPh 21 -->
      ${pg.pph21.pkpTahunan > 0 ? `
      <details style="margin-bottom:16px;font-size:12px;color:var(--text-secondary)">
        <summary style="cursor:pointer;padding:8px 0">Detail Perhitungan PPh 21</summary>
        <div style="padding:12px;background:var(--bg-surface);border-radius:6px;margin-top:8px">
          <div>Bruto Tahunan: ${Formatter.rupiah(pg.pph21.brutoTahunan)}</div>
          <div>Biaya Jabatan: -${Formatter.rupiah(pg.pph21.biayaJabatan)}</div>
          <div>Neto Tahunan: ${Formatter.rupiah(pg.pph21.netoTahunan)}</div>
          <div>PTKP: -${Formatter.rupiah(pg.pph21.ptkp)}</div>
          <div><strong>PKP Tahunan: ${Formatter.rupiah(pg.pph21.pkpTahunan)}</strong></div>
          <br>
          ${pg.pph21.detail.map(d => `
            <div>${d.label} × ${d.tarif} = ${Formatter.rupiah(d.pajak)}</div>
          `).join("")}
          <div><strong>Total PPh Tahunan: ${Formatter.rupiah(pg.pph21.pajakTahunan)}</strong></div>
          <div>PPh Bulanan (÷12): <strong>${Formatter.rupiah(pg.pph21.pajakBulanan)}</strong></div>
        </div>
      </details>` : ""}

      <!-- GAJI BERSIH -->
      <div class="slip-bersih-box">
        <div class="slip-bersih-label">GAJI BERSIH DITERIMA</div>
        <div class="slip-bersih-value">${Formatter.rupiah(pg.gajiBersih)}</div>
      </div>

      <div style="margin-top:20px;font-size:11px;color:var(--text-muted);text-align:center">
        Slip gaji ini dicetak secara otomatis oleh sistem. Tidak memerlukan tanda tangan.
      </div>
    `;
  }

  function init() {
    // Populate bulan/tahun
    const bulanSel = document.getElementById("slip-bulan");
    const tahunSel = document.getElementById("slip-tahun");
    CONSTANTS.BULAN.forEach((b, i) => {
      bulanSel.innerHTML += `<option value="${i + 1}" ${i + 1 === currentBulan ? "selected" : ""}>${b}</option>`;
    });
    for (let y = 2023; y <= 2030; y++) {
      tahunSel.innerHTML += `<option value="${y}" ${y === currentTahun ? "selected" : ""}>${y}</option>`;
    }

    document.getElementById("slip-bulan").addEventListener("change", renderList);
    document.getElementById("slip-tahun").addEventListener("change", renderList);
    document.getElementById("slip-search").addEventListener("input", renderList);
    document.getElementById("close-modal-slip").addEventListener("click", () => closeModal("modal-slip"));

    renderList();
  }

  return { init, renderList, openDetail };

})();
