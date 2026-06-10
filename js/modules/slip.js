/**
 * MODULE: slip.js
 * Logika UI untuk tampilan dan cetak slip gaji.
 */

const SlipModule = (() => {

  let currentBulan = new Date().getMonth() + 1;
  let currentTahun = new Date().getFullYear();

  async function renderList() {
    const bulan = parseInt(document.getElementById("slip-bulan").value);
    const tahun = parseInt(document.getElementById("slip-tahun").value);
    const keyword = document.getElementById("slip-search").value.toLowerCase();

    currentBulan = bulan;
    currentTahun = tahun;

    let data = [];
    try {
      const res = await API.payroll.getAll({ bulan, tahun });
      data = res?.data || [];
    } catch (err) {
      Toast.show('Gagal memuat slip gaji: ' + err.message, 'error');
      return;
    }

    if (keyword) {
      data = data.filter(p =>
        (p.nama_lengkap || '').toLowerCase().includes(keyword) ||
        (p.nik || '').toLowerCase().includes(keyword)
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

    function avatarClass(nama) {
      let sum = 0;
      for (let i = 0; i < (nama || '').length; i++) sum += nama.charCodeAt(i);
      return 'av-' + (sum % 8);
    }

    container.innerHTML = data.map(p => {
      const nama     = p.nama_lengkap || '';
      const initials = nama ? nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
      const avColor  = avatarClass(nama);
      return `
        <div class="slip-card" onclick="SlipModule.openDetail(${p.id})">
          <div class="slip-card-info employee-cell">
            <div class="avatar ${avColor}" style="width:36px;height:36px;font-size:13px">${initials}</div>
            <div class="employee-info">
              <div class="slip-card-name">${nama}</div>
              <div class="slip-card-meta">${p.nik || ''} · ${p.jabatan || ''} · ${p.departemen || ''}</div>
            </div>
          </div>
          <div class="slip-card-gaji">${Formatter.rupiah(p.total_gaji_bersih || 0)}</div>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); SlipModule.openDetail(${p.id})">Lihat Slip</button>
        </div>
      `;
    }).join("");
  }

  async function openDetail(payrollId) {
    try {
      const res = await API.payroll.getById(payrollId);
      const pg = res?.data;
      if (!pg) {
        Toast.show("Data slip tidak ditemukan", "error");
        return;
      }
      const content = buildSlipHTML(pg);
      document.getElementById("slip-detail-content").innerHTML = content;
      openModal("modal-slip");
    } catch (err) {
      Toast.show('Gagal membuka slip: ' + err.message, 'error');
    }
  }

  function buildSlipHTML(pg) {
    // pg adalah data dari DB: nama_lengkap, nik, jabatan, departemen, dll.
    const bulan = pg.bulan_angka || currentBulan;
    const tahun = pg.tahun      || currentTahun;
    return `
      <div class="slip-detail-header">
        <div class="slip-company">PT. MAJU BERSAMA INDONESIA</div>
        <div class="slip-title">SLIP GAJI KARYAWAN</div>
        <div class="slip-period">Periode: ${pg.periode_bulan || Formatter.periodeGaji(bulan, tahun)}</div>
        <div class="slip-period" style="margin-top:4px;font-size:11px;color:var(--text-muted)">Dicetak: ${Formatter.tanggal(new Date().toISOString())}</div>
      </div>

      <div class="slip-employee-info">
        <div class="slip-field">
          <span class="slip-field-label">NIK</span>
          <span class="slip-field-value">${pg.nik || '-'}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Nama</span>
          <span class="slip-field-value">${pg.nama_lengkap || '-'}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Jabatan</span>
          <span class="slip-field-value">${pg.jabatan || '-'}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Departemen</span>
          <span class="slip-field-value">${pg.departemen || '-'}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Status</span>
          <span class="slip-field-value">${pg.status_pekerjaan || '-'}</span>
        </div>
      </div>

      <table class="slip-table">
        <!-- PENGHASILAN -->
        <tr class="slip-section-title"><td colspan="2">▸ PENGHASILAN</td></tr>
        <tr>
          <td>Gaji Pokok</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.gaji_pokok || 0)}</td>
        </tr>
        <tr>
          <td>Tunjangan</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(pg.tunjangan || 0)}</td>
        </tr>
        ${(pg.jam_lembur > 0) ? `
        <tr>
          <td>Upah Lembur (${pg.jam_lembur} jam)</td>
          <td class="slip-row-right text-success">${Formatter.rupiah(SalaryCalculator.hitungLembur(pg.gaji_pokok || 0, pg.jam_lembur))}</td>
        </tr>` : ''}
        <tr style="font-weight:600;border-top:1px solid var(--border)">
          <td>Total Penghasilan</td>
          <td class="slip-row-right text-success">${Formatter.rupiah((pg.gaji_pokok || 0) + (pg.tunjangan || 0) + SalaryCalculator.hitungLembur(pg.gaji_pokok || 0, pg.jam_lembur || 0))}</td>
        </tr>

        <tr><td colspan="2" style="padding:8px 0"></td></tr>

        <!-- POTONGAN -->
        <tr class="slip-section-title"><td colspan="2">▸ POTONGAN</td></tr>
        <tr>
          <td>BPJS + PPh 21</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.pajak || 0)}</td>
        </tr>
        <tr>
          <td>Potongan Lainnya</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah((pg.potongan || 0) - (pg.pajak || 0))}</td>
        </tr>
        <tr style="font-weight:600;border-top:1px solid var(--border)">
          <td>Total Potongan</td>
          <td class="slip-row-right text-danger">-${Formatter.rupiah(pg.potongan || 0)}</td>
        </tr>
      </table>

      <!-- GAJI BERSIH -->
      <div class="slip-bersih-box">
        <div class="slip-bersih-label">GAJI BERSIH DITERIMA</div>
        <div class="slip-bersih-value">${Formatter.rupiah(pg.total_gaji_bersih || 0)}</div>
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
