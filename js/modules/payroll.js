/**
 * MODULE: payroll.js
 * Logika UI untuk halaman hitung gaji karyawan.
 */

const PayrollModule = (() => {

  let currentBulan = new Date().getMonth() + 1;
  let currentTahun = new Date().getFullYear();
  let editingKaryawanId = null;

  // ── RENDER TABLE ──
  function renderTable() {
    const dept = document.getElementById("pg-dept")?.value || "";
    let karyawan = Storage.getAllKaryawan();
    if (dept) karyawan = karyawan.filter(k => k.departemen === dept);

    const tbody = document.getElementById("tbody-penggajian");

    if (karyawan.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state"><div class="empty-icon">◎</div><p>Belum ada data karyawan. Tambahkan karyawan terlebih dahulu.</p></td></tr>`;
      return;
    }

    tbody.innerHTML = karyawan.map(k => {
      const pg = Storage.getPenggajian(k.id, currentBulan, currentTahun);
      if (pg) {
        return `
          <tr>
            <td class="mono">${k.id}</td>
            <td><strong>${k.nama}</strong></td>
            <td>${k.jabatan}</td>
            <td class="mono">${pg.jamLembur}</td>
            <td class="mono">${pg.hariAbsensi}</td>
            <td class="mono">${Formatter.rupiah(pg.gajiPokok)}</td>
            <td class="mono">${Formatter.rupiah(pg.tunjangan.total)}</td>
            <td class="mono text-danger">-${Formatter.rupiah(pg.totalPotongan)}</td>
            <td class="mono" style="color:var(--accent-success)"><strong>${Formatter.rupiah(pg.gajiBersih)}</strong></td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="PayrollModule.openInput('${k.id}')">Edit</button>
            </td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td class="mono">${k.id}</td>
            <td><strong>${k.nama}</strong></td>
            <td>${k.jabatan}</td>
            <td colspan="6" style="color:var(--text-muted);font-style:italic">Belum dihitung</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="PayrollModule.openInput('${k.id}')">Hitung</button>
            </td>
          </tr>
        `;
      }
    }).join("");
  }

  // ── MODAL INPUT ──
  function openInput(idKaryawan) {
    const k = Storage.getKaryawanById(idKaryawan);
    if (!k) return;
    editingKaryawanId = idKaryawan;

    document.getElementById("modal-pg-title").textContent = `Input Gaji — ${k.nama}`;
    document.getElementById("pg-id-karyawan").value = idKaryawan;

    // Info box
    const gajiPokok = SalaryCalculator.hitungGajiPokok(k.golongan, k.status);
    document.getElementById("pg-karyawan-info").innerHTML = `
      <strong>${k.nama}</strong> · ${k.jabatan} · Gol. ${k.golongan}<br>
      Status: <strong>${k.status}</strong> · Dept: ${k.departemen}<br>
      Gaji Pokok: <strong>${Formatter.rupiah(gajiPokok)}</strong>
    `;

    // Pre-fill kalau sudah ada data
    const existing = Storage.getPenggajian(idKaryawan, currentBulan, currentTahun);
    document.getElementById("pg-lembur").value = existing ? existing.jamLembur : 0;
    document.getElementById("pg-absensi").value = existing ? existing.hariAbsensi : 0;

    clearPgErrors();
    openModal("modal-penggajian");
  }

  // ── HITUNG SEMUA ──
  function hitungSemua() {
    const karyawan = Storage.getAllKaryawan();
    let berhasil = 0;

    karyawan.forEach(k => {
      const existing = Storage.getPenggajian(k.id, currentBulan, currentTahun);
      if (!existing) {
        try {
          const hasil = SalaryCalculator.hitungGajiLengkap(k, 0, 0);
          Storage.savePenggajian({
            ...hasil,
            bulan: currentBulan,
            tahun: currentTahun,
          });
          berhasil++;
        } catch (err) {
          console.warn(`Gagal hitung ${k.id}:`, err);
        }
      }
    });

    renderTable();
    Toast.show(`${berhasil} karyawan berhasil dihitung otomatis`, "success");
  }

  // ── FORM SUBMIT ──
  function handleSubmit(e) {
    e.preventDefault();
    clearPgErrors();

    const idKaryawan = document.getElementById("pg-id-karyawan").value;
    const jamLembur = parseFloat(document.getElementById("pg-lembur").value);
    const hariAbsensi = parseInt(document.getElementById("pg-absensi").value, 10);

    const validation = Validator.validateFormPenggajian({ jamLembur, hariAbsensi });
    if (!validation.valid) {
      if (validation.errors.lembur) {
        document.getElementById("err-lembur").textContent = validation.errors.lembur[0];
        document.getElementById("pg-lembur").classList.add("error");
      }
      if (validation.errors.absensi) {
        document.getElementById("err-absensi").textContent = validation.errors.absensi[0];
        document.getElementById("pg-absensi").classList.add("error");
      }
      return;
    }

    const karyawan = Storage.getKaryawanById(idKaryawan);
    if (!karyawan) {
      Toast.show("Karyawan tidak ditemukan", "error");
      return;
    }

    try {
      const hasil = SalaryCalculator.hitungGajiLengkap(karyawan, jamLembur, hariAbsensi);
      Storage.savePenggajian({
        ...hasil,
        bulan: currentBulan,
        tahun: currentTahun,
      });

      closeModal("modal-penggajian");
      renderTable();
      Toast.show(`Gaji ${karyawan.nama} berhasil dihitung`, "success");
    } catch (err) {
      Toast.show(`Error: ${err.message}`, "error");
    }
  }

  function clearPgErrors() {
    document.getElementById("err-lembur").textContent = "";
    document.getElementById("err-absensi").textContent = "";
    document.getElementById("pg-lembur").classList.remove("error");
    document.getElementById("pg-absensi").classList.remove("error");
  }

  // ── INIT ──
  function init() {
    // Populate bulan/tahun selects
    const bulanSel = document.getElementById("pg-bulan");
    CONSTANTS.BULAN.forEach((b, i) => {
      bulanSel.innerHTML += `<option value="${i + 1}" ${i + 1 === currentBulan ? "selected" : ""}>${b}</option>`;
    });
    document.getElementById("pg-tahun").value = currentTahun;

    // Populate dept filter
    const deptSel = document.getElementById("pg-dept");
    CONSTANTS.DEPARTEMEN.forEach(d => {
      deptSel.innerHTML += `<option value="${d}">${d}</option>`;
    });

    // Events
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
