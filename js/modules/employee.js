/**
 * MODULE: employee.js
 * Logika UI untuk manajemen data karyawan (CRUD).
 */

const EmployeeModule = (() => {

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let editingId = null;

  // ── RENDER TABLE ──
  function render() {
    const keyword = document.getElementById("search-karyawan").value.toLowerCase();
    const dept = document.getElementById("filter-dept").value;
    const status = document.getElementById("filter-status").value;

    let data = Storage.getAllKaryawan();

    // Filter
    if (keyword) {
      data = data.filter(k =>
        k.nama.toLowerCase().includes(keyword) ||
        k.id.toLowerCase().includes(keyword)
      );
    }
    if (dept) data = data.filter(k => k.departemen === dept);
    if (status) data = data.filter(k => k.status === status);

    // Pagination
    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pageData = data.slice(startIdx, startIdx + PAGE_SIZE);

    // Render tbody
    const tbody = document.getElementById("tbody-karyawan");
    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><div class="empty-icon">◉</div><p>Belum ada data karyawan</p></td></tr>`;
    } else {
      tbody.innerHTML = pageData.map(k => `
        <tr>
          <td class="mono">${k.id}</td>
          <td><strong>${k.nama}</strong></td>
          <td>${k.jabatan}</td>
          <td>Gol. ${k.golongan}</td>
          <td><span class="badge badge-${k.status.toLowerCase()}">${k.status}</span></td>
          <td>${k.departemen}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="EmployeeModule.openEdit('${k.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="EmployeeModule.confirmDelete('${k.id}', '${k.nama}')">Hapus</button>
          </td>
        </tr>
      `).join("");
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

  function openEdit(id) {
    const k = Storage.getKaryawanById(id);
    if (!k) return;
    editingId = id;
    document.getElementById("modal-karyawan-title").textContent = "Edit Karyawan";
    document.getElementById("f-id").value = k.id;
    document.getElementById("f-id").disabled = true; // ID tidak bisa diubah
    document.getElementById("f-nama").value = k.nama;
    document.getElementById("f-jabatan").value = k.jabatan;
    document.getElementById("f-golongan").value = k.golongan;
    document.getElementById("f-status").value = k.status;
    document.getElementById("f-departemen").value = k.departemen;
    document.getElementById("f-npwp").value = k.npwp || "";
    document.getElementById("f-ptkp").value = k.ptkp || "TK0";
    clearErrors();
    openModal("modal-karyawan");
  }

  function confirmDelete(id, nama) {
    if (confirm(`Hapus karyawan "${nama}" (${id})?\nData penggajian terkait tidak akan terhapus.`)) {
      Storage.deleteKaryawan(id);
      render();
      DashboardModule.refresh();
      Toast.show(`Karyawan ${nama} berhasil dihapus`, "info");
    }
  }

  // ── FORM SUBMIT ──
  function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    const data = {
      id: document.getElementById("f-id").value.trim().toUpperCase(),
      nama: document.getElementById("f-nama").value.trim(),
      jabatan: document.getElementById("f-jabatan").value,
      golongan: document.getElementById("f-golongan").value,
      status: document.getElementById("f-status").value,
      departemen: document.getElementById("f-departemen").value,
      npwp: document.getElementById("f-npwp").value.trim(),
      ptkp: document.getElementById("f-ptkp").value,
    };

    const result = Validator.validateFormKaryawan(data);

    if (!result.valid) {
      showErrors(result.errors);
      return;
    }

    // Cek duplikat ID (kecuali saat edit)
    if (!editingId && Storage.isIdExists(data.id)) {
      showErrors({ id: ["ID Karyawan sudah digunakan"] });
      return;
    }

    Storage.saveKaryawan(data);
    closeModal("modal-karyawan");
    render();
    DashboardModule.refresh();
    PayrollModule.renderTable();
    Toast.show(
      editingId ? `Data ${data.nama} berhasil diperbarui` : `Karyawan ${data.nama} berhasil ditambahkan`,
      "success"
    );
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
    // Scroll ke error pertama
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

  return { init, render, openAdd, openEdit, confirmDelete, goPage };

})();
