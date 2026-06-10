/**
 * MODULE: payroll.js
 * Logika UI untuk halaman hitung gaji karyawan.
 * ✅ Sudah dimigrasi ke backend API (MySQL)
 */

const PayrollModule = (() => {

  let currentBulan = new Date().getMonth() + 1;
  let currentTahun = new Date().getFullYear();
  let editingKaryawanId = null;

  // Cache data dari API
  let cachedKaryawan = [];
  let cachedPayroll  = [];

  // ── HELPER: avatar ──
  function avatarClass(nama) {
    let sum = 0;
    for (let i = 0; i < (nama || '').length; i++) sum += nama.charCodeAt(i);
    return 'av-' + (sum % 8);
  }

  // ── LOAD DATA ──
  async function loadAllData() {
    try {
      const [empRes, pgRes] = await Promise.all([
        API.employees.getAll(),
        API.payroll.getAll({ bulan: currentBulan, tahun: currentTahun }),
      ]);
      cachedKaryawan = empRes?.data || [];
      cachedPayroll  = pgRes?.data  || [];
    } catch (err) {
      Toast.show('Gagal memuat data penggajian: ' + err.message, 'error');
      cachedKaryawan = [];
      cachedPayroll  = [];
    }
  }

  // Cari data gaji dari cache berdasarkan employee_id
  function findPayroll(employeeId) {
    return cachedPayroll.find(p => p.employee_id === employeeId) || null;
  }

  // ── RENDER TABLE ──
  async function renderTable() {
    await loadAllData();

    const dept = document.getElementById("pg-dept")?.value || "";
    let karyawan = cachedKaryawan;
    if (dept) karyawan = karyawan.filter(k => k.departemen === dept);

    const tbody = document.getElementById("tbody-penggajian");

    if (karyawan.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><div class="empty-icon">◎</div><p>Belum ada data karyawan. Tambahkan karyawan terlebih dahulu.</p></td></tr>`;
      return;
    }

    tbody.innerHTML = karyawan.map(k => {
      const nama     = k.nama_lengkap || '';
      const initials = nama ? nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
      const avColor  = avatarClass(nama);
      const pg       = findPayroll(k.id);

      const karyawanCell = `
        <div class="employee-cell">
          <div class="avatar ${avColor}">${initials}</div>
          <div class="employee-info">
            <div class="employee-name">${nama}</div>
            <div class="employee-role">${k.jabatan || ''} · ${k.departemen || ''}</div>
          </div>
        </div>`;

      if (pg) {
        return `
          <tr>
            <td>${karyawanCell}</td>
            <td class="mono">${pg.jam_lembur || 0}</td>
            <td class="mono">${pg.hari_absensi || 0}</td>
            <td class="mono">${Formatter.rupiah(pg.gaji_pokok || 0)}</td>
            <td class="mono">${Formatter.rupiah(pg.tunjangan || 0)}</td>
            <td class="mono" style="color:var(--danger)">-${Formatter.rupiah(pg.potongan || 0)}</td>
            <td class="mono" style="color:var(--success);font-weight:700">${Formatter.rupiah(pg.total_gaji_bersih || 0)}</td>
            <td><button class="btn btn-ghost btn-sm" onclick="PayrollModule.openInput(${k.id})">Edit</button></td>
          </tr>`;
      } else {
        return `
          <tr>
            <td>${karyawanCell}</td>
            <td colspan="6" style="color:var(--text-muted);font-style:italic;font-size:13px">Belum dihitung pada periode ini</td>
            <td><button class="btn btn-primary btn-sm" onclick="PayrollModule.openInput(${k.id})">Hitung</button></td>
          </tr>`;
      }
    }).join('');
  }

  // ── MODAL INPUT ──
  async function openInput(idKaryawan) {
    try {
      const res = await API.employees.getById(idKaryawan);
      const k = res?.data;
      if (!k) return;
      editingKaryawanId = idKaryawan;

      document.getElementById("modal-pg-title").textContent = `Input Gaji — ${k.nama_lengkap}`;
      document.getElementById("pg-id-karyawan").value = idKaryawan;

      const gajiPokok = SalaryCalculator.hitungGajiPokok(k.golongan, k.status_pekerjaan);
      document.getElementById("pg-karyawan-info").innerHTML = `
        <strong>${k.nama_lengkap}</strong> · ${k.jabatan} · Gol. ${k.golongan}<br>
        Status: <strong>${k.status_pekerjaan}</strong> · Dept: ${k.departemen}<br>
        Gaji Pokok: <strong>${Formatter.rupiah(gajiPokok)}</strong>
      `;

      // Pre-fill jika sudah ada data bulan ini
      const existing = findPayroll(idKaryawan);
      document.getElementById("pg-lembur").value   = existing ? (existing.jam_lembur   || 0) : 0;
      document.getElementById("pg-absensi").value  = existing ? (existing.hari_absensi || 0) : 0;

      clearPgErrors();
      openModal("modal-penggajian");
    } catch (err) {
      Toast.show('Gagal membuka form penggajian: ' + err.message, 'error');
    }
  }

  // ── HITUNG SEMUA ──
  async function hitungSemua() {
    const karyawan = cachedKaryawan;
    let berhasil = 0;
    let gagal = 0;

    for (const k of karyawan) {
      const existing = findPayroll(k.id);
      if (!existing) {
        try {
          const hasil = SalaryCalculator.hitungGajiLengkap(
            { ...k, id: k.nik, golongan: k.golongan, status: k.status_pekerjaan },
            0, 0
          );
          const bulanNama = CONSTANTS.BULAN[currentBulan - 1];
          await API.payroll.save({
            employee_id:      k.id,
            periode_bulan:    `${bulanNama} ${currentTahun}`,
            bulan_angka:      currentBulan,
            tahun:            currentTahun,
            gaji_pokok:       hasil.gajiPokok,
            tunjangan:        hasil.tunjangan?.total || 0,
            potongan:         hasil.totalPotongan    || 0,
            pajak:            (hasil.bpjs?.total || 0) + (hasil.pph21?.pajakBulanan || 0),
            total_gaji_bersih: hasil.gajiBersih,
            jam_lembur:       0,
            hari_absensi:     0,
          });
          berhasil++;
        } catch (err) {
          console.warn(`Gagal hitung ${k.id}:`, err);
          gagal++;
        }
      }
    }

    await renderTable();
    Toast.show(`${berhasil} karyawan berhasil dihitung otomatis${gagal > 0 ? `, ${gagal} gagal` : ''}`, berhasil > 0 ? "success" : "warning");
  }

  // ── FORM SUBMIT ──
  async function handleSubmit(e) {
    e.preventDefault();
    clearPgErrors();

    const idKaryawan  = parseInt(document.getElementById("pg-id-karyawan").value);
    const jamLembur   = parseFloat(document.getElementById("pg-lembur").value)  || 0;
    const hariAbsensi = parseInt(document.getElementById("pg-absensi").value, 10) || 0;

    const validation = Validator.validateFormPenggajian({ jamLembur, hariAbsensi });
    if (!validation.valid) {
      if (validation.errors.lembur) {
        document.getElementById("err-lembur").textContent  = validation.errors.lembur[0];
        document.getElementById("pg-lembur").classList.add("error");
      }
      if (validation.errors.absensi) {
        document.getElementById("err-absensi").textContent = validation.errors.absensi[0];
        document.getElementById("pg-absensi").classList.add("error");
      }
      return;
    }

    try {
      const empRes = await API.employees.getById(idKaryawan);
      const karyawan = empRes?.data;
      if (!karyawan) { Toast.show("Karyawan tidak ditemukan", "error"); return; }

      // Hitung gaji menggunakan SalaryCalculator
      const kProxy = { ...karyawan, id: karyawan.nik, golongan: karyawan.golongan, status: karyawan.status_pekerjaan };
      const hasil = SalaryCalculator.hitungGajiLengkap(kProxy, jamLembur, hariAbsensi);
      const bulanNama = CONSTANTS.BULAN[currentBulan - 1];

      await API.payroll.save({
        employee_id:      idKaryawan,
        periode_bulan:    `${bulanNama} ${currentTahun}`,
        bulan_angka:      currentBulan,
        tahun:            currentTahun,
        gaji_pokok:       hasil.gajiPokok,
        tunjangan:        hasil.tunjangan?.total || 0,
        potongan:         hasil.totalPotongan    || 0,
        pajak:            (hasil.bpjs?.total || 0) + (hasil.pph21?.pajakBulanan || 0),
        total_gaji_bersih: hasil.gajiBersih,
        jam_lembur:       jamLembur,
        hari_absensi:     hariAbsensi,
      });

      closeModal("modal-penggajian");
      await renderTable();
      Toast.show(`Gaji ${karyawan.nama_lengkap} berhasil dihitung`, "success");
    } catch (err) {
      Toast.show(`Error: ${err.message}`, "error");
    }
  }

  function clearPgErrors() {
    document.getElementById("err-lembur").textContent  = "";
    document.getElementById("err-absensi").textContent = "";
    document.getElementById("pg-lembur").classList.remove("error");
    document.getElementById("pg-absensi").classList.remove("error");
  }

  // ── INIT ──
  function init() {
    const bulanSel = document.getElementById("pg-bulan");
    CONSTANTS.BULAN.forEach((b, i) => {
      bulanSel.innerHTML += `<option value="${i + 1}" ${i + 1 === currentBulan ? "selected" : ""}>${b}</option>`;
    });
    document.getElementById("pg-tahun").value = currentTahun;

    const deptSel = document.getElementById("pg-dept");
    CONSTANTS.DEPARTEMEN.forEach(d => {
      deptSel.innerHTML += `<option value="${d}">${d}</option>`;
    });

    document.getElementById("pg-bulan").addEventListener("change", (e) => {
      currentBulan = parseInt(e.target.value);
      renderTable();
    });
    document.getElementById("pg-tahun").addEventListener("change", (e) => {
      const val = parseInt(e.target.value);
      if (val >= 2020 && val <= 2030) {
        currentTahun = val;
        renderTable();
      }
    });
    document.getElementById("pg-dept").addEventListener("change", renderTable);
    document.getElementById("btn-hitung-semua").addEventListener("click", hitungSemua);
    document.getElementById("form-penggajian").addEventListener("submit", handleSubmit);
    document.getElementById("close-modal-pg").addEventListener("click", () => closeModal("modal-penggajian"));
    document.getElementById("cancel-pg").addEventListener("click", () => closeModal("modal-penggajian"));

    renderTable();
  }

  function getCurrentPeriode() { return { bulan: currentBulan, tahun: currentTahun }; }

  return { init, renderTable, openInput, hitungSemua, getCurrentPeriode };

})();
