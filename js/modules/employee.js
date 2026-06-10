/**
 * MODULE: employee.js
 * Logika UI untuk manajemen data karyawan (CRUD).
 * ✅ Sudah dimigrasi ke backend API (MySQL)
 */

const EmployeeModule = (() => {

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let editingId = null;
  let allData = []; // cache data dari server

  // ── HELPER: avatar color ──
  function avatarClass(nama) {
    let sum = 0;
    for (let i = 0; i < (nama || '').length; i++) sum += nama.charCodeAt(i);
    return 'av-' + (sum % 8);
  }

  // ── LOAD DATA DARI API ──
  async function loadData() {
    try {
      const keyword  = document.getElementById("search-karyawan")?.value?.toLowerCase() || '';
      const dept     = document.getElementById("filter-dept")?.value || '';
      const status   = document.getElementById("filter-status")?.value || '';

      const params = {};
      if (keyword) params.search     = keyword;
      if (dept)    params.departemen = dept;
      if (status)  params.status     = status;

      const res = await API.employees.getAll(params);
      // API kembalikan field dari DB: id, nik, nama_lengkap, jabatan, golongan, status_pekerjaan, departemen
      allData = res?.data || [];
    } catch (err) {
      Toast.show('Gagal memuat data karyawan: ' + err.message, 'error');
      allData = [];
    }
  }

  // ── RENDER TABLE ──
  async function render() {
    await loadData();

    const total      = allData.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pageData = allData.slice(startIdx, startIdx + PAGE_SIZE);

    const tbody = document.getElementById("tbody-karyawan");
    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="empty-icon">◉</div><p>Belum ada data karyawan</p></td></tr>`;
    } else {
      tbody.innerHTML = pageData.map(k => {
        const nama     = k.nama_lengkap || '';
        const initials = nama ? nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
        const avColor  = avatarClass(nama);
        const statusVal = k.status_pekerjaan || '-';
        return `
          <tr>
            <td>
              <div class="employee-cell">
                <div class="avatar ${avColor}">${initials}</div>
                <div class="employee-info">
                  <div class="employee-name">${nama}</div>
                  <div class="employee-role">${k.jabatan || '-'}</div>
                </div>
              </div>
            </td>
            <td class="mono" style="font-size:12px;color:var(--text-muted)">${k.nik || '-'}</td>
            <td>Gol. ${k.golongan || '-'}</td>
            <td><span class="badge badge-${statusVal.toLowerCase()}">${statusVal}</span></td>
            <td>${k.departemen || '-'}</td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="EmployeeModule.openEdit(${k.id})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="EmployeeModule.confirmDelete(${k.id}, '${nama.replace(/'/g, "\\'")}')">Hapus</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    renderPagination(totalPages);
    populateDeptFilter();
  }

  function renderPagination(totalPages) {
    const container = document.getElementById("pagination-karyawan");
    let html = "";
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="EmployeeModule.goPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
  }

  function goPage(page) {
    currentPage = page;
    render();
  }

  function populateDeptFilter() {
    const sel = document.getElementById("filter-dept");
    const current = sel.value;
    sel.innerHTML = `<option value="">Semua Departemen</option>`;
    CONSTANTS.DEPARTEMEN.forEach(d => {
      sel.innerHTML += `<option value="${d}" ${current === d ? "selected" : ""}>${d}</option>`;
    });
  }

  // ── MODAL ──
  function openAdd() {
    editingId = null;
    document.getElementById("modal-karyawan-title").textContent = "Tambah Karyawan";
    document.getElementById("form-karyawan").reset();
    clearErrors();
    document.getElementById("f-id").disabled = false;
    openModal("modal-karyawan");
  }

  async function openEdit(id) {
    try {
      const res = await API.employees.getById(id);
      const k = res?.data;
      if (!k) return;
      editingId = id;
      document.getElementById("modal-karyawan-title").textContent = "Edit Karyawan";
      document.getElementById("f-id").value      = k.nik || '';
      document.getElementById("f-id").disabled   = true;
      document.getElementById("f-nama").value    = k.nama_lengkap || '';
      document.getElementById("f-jabatan").value = k.jabatan || '';
      document.getElementById("f-golongan").value= k.golongan || '';
      document.getElementById("f-status").value  = k.status_pekerjaan || '';
      document.getElementById("f-departemen").value = k.departemen || '';
      document.getElementById("f-npwp").value    = k.npwp || '';
      document.getElementById("f-ptkp").value    = k.ptkp || 'TK0';
      clearErrors();
      openModal("modal-karyawan");
    } catch (err) {
      Toast.show('Gagal memuat data karyawan: ' + err.message, 'error');
    }
  }

  async function confirmDelete(id, nama) {
    if (confirm(`Hapus karyawan "${nama}" (ID: ${id})?\nData penggajian terkait tidak akan terhapus.`)) {
      try {
        await API.employees.delete(id);
        render();
        DashboardModule.refresh();
        Toast.show(`Karyawan ${nama} berhasil dihapus`, "info");
      } catch (err) {
        Toast.show('Gagal menghapus: ' + err.message, 'error');
      }
    }
  }

  // ── FORM SUBMIT ──
  async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    const nikVal = document.getElementById("f-id").value.trim().toUpperCase();
    const data = {
      nik:              nikVal,
      nama_lengkap:     document.getElementById("f-nama").value.trim(),
      jabatan:          document.getElementById("f-jabatan").value,
      golongan:         document.getElementById("f-golongan").value,
      status_pekerjaan: document.getElementById("f-status").value,
      departemen:       document.getElementById("f-departemen").value,
      npwp:             document.getElementById("f-npwp").value.trim(),
      ptkp:             document.getElementById("f-ptkp").value,
      // gaji_pokok dihitung dari golongan di backend atau dari SalaryCalculator
      gaji_pokok:       SalaryCalculator.hitungGajiPokok(
                          document.getElementById("f-golongan").value,
                          document.getElementById("f-status").value
                        ),
    };

    // Validasi minimal
    if (!data.nik) { showErrors({ id: ['NIK wajib diisi'] }); return; }
    if (!data.nama_lengkap) { showErrors({ nama: ['Nama wajib diisi'] }); return; }
    if (!data.golongan) { showErrors({ golongan: ['Golongan wajib dipilih'] }); return; }

    try {
      if (editingId) {
        await API.employees.update(editingId, data);
        Toast.show(`Data ${data.nama_lengkap} berhasil diperbarui`, "success");
      } else {
        await API.employees.create(data);
        Toast.show(`Karyawan ${data.nama_lengkap} berhasil ditambahkan`, "success");
      }
      closeModal("modal-karyawan");
      render();
      DashboardModule.refresh();
      PayrollModule.renderTable();
    } catch (err) {
      Toast.show('Gagal menyimpan: ' + err.message, 'error');
    }
  }

  function clearErrors() {
    ["id", "nama", "jabatan", "golongan", "status", "departemen", "npwp"].forEach(f => {
      const el = document.getElementById(`err-${f}`);
      if (el) el.textContent = "";
      const input = document.getElementById(`f-${f}`);
      if (input) input.classList.remove("error");
    });
  }

  function showErrors(errors) {
    Object.entries(errors).forEach(([field, msgs]) => {
      const el = document.getElementById(`err-${field}`);
      if (el) el.textContent = msgs[0];
      const input = document.getElementById(`f-${field}`);
      if (input) input.classList.add("error");
    });
    const firstError = document.querySelector(".input-field.error");
    if (firstError) firstError.focus();
  }

  // ── INIT ──
  function init() {
    document.getElementById("btn-add-karyawan").addEventListener("click", openAdd);
    document.getElementById("form-karyawan").addEventListener("submit", handleSubmit);
    document.getElementById("close-modal-karyawan").addEventListener("click", () => closeModal("modal-karyawan"));
    document.getElementById("cancel-karyawan").addEventListener("click", () => closeModal("modal-karyawan"));

    document.getElementById("search-karyawan").addEventListener("input", () => { currentPage = 1; render(); });
    document.getElementById("filter-dept").addEventListener("change", () => { currentPage = 1; render(); });
    document.getElementById("filter-status").addEventListener("change", () => { currentPage = 1; render(); });

    render();
  }

  // Expose allData untuk modul lain yang butuh list karyawan
  function getAll() { return allData; }

  return { init, render, openAdd, openEdit, confirmDelete, goPage, getAll };

})();
