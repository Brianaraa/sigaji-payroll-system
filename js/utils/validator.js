/**
 * UTIL: validator.js
 * ============================================================
 * Kumpulan fungsi validasi input.
 * Dipisahkan agar bisa dijadikan target blackbox testing
 * (boundary value analysis, equivalence partitioning).
 * ============================================================
 */

const Validator = (() => {

  /**
   * Validasi ID Karyawan
   * Format: alfanumerik, 3–10 karakter, boleh ada "-"
   * Contoh valid: "KRY-001", "EMP001"
   */
  function validateIdKaryawan(id) {
    const errors = [];

    if (!id || id.trim() === "") {
      errors.push("ID Karyawan tidak boleh kosong");
      return errors;
    }

    const trimmed = id.trim();

    if (trimmed.length < 3) {
      errors.push("ID minimal 3 karakter");
    }
    if (trimmed.length > 10) {
      errors.push("ID maksimal 10 karakter");
    }
    if (!/^[A-Za-z0-9\-]+$/.test(trimmed)) {
      errors.push("ID hanya boleh berisi huruf, angka, dan tanda '-'");
    }

    return errors;
  }

  /**
   * Validasi Nama Karyawan
   * - Tidak boleh kosong
   * - 2–60 karakter
   * - Hanya huruf, spasi, titik, koma, apostrof
   */
  function validateNama(nama) {
    const errors = [];

    if (!nama || nama.trim() === "") {
      errors.push("Nama tidak boleh kosong");
      return errors;
    }

    const trimmed = nama.trim();

    if (trimmed.length < 2) {
      errors.push("Nama minimal 2 karakter");
    }
    if (trimmed.length > 60) {
      errors.push("Nama maksimal 60 karakter");
    }
    if (!/^[A-Za-z\s\.\,\'\-]+$/.test(trimmed)) {
      errors.push("Nama hanya boleh berisi huruf dan karakter nama umum");
    }

    return errors;
  }

  /**
   * Validasi pilihan (select/dropdown)
   * Cek apakah value ada dalam daftar yang diizinkan
   */
  function validatePilihan(value, daftarValid, labelField) {
    const errors = [];
    if (!value || value === "") {
      errors.push(`${labelField} harus dipilih`);
    } else if (!daftarValid.includes(value)) {
      errors.push(`${labelField} tidak valid`);
    }
    return errors;
  }

  /**
   * Validasi NPWP (opsional)
   * Jika diisi, harus 15 digit angka
   */
  function validateNPWP(npwp) {
    const errors = [];
    if (!npwp || npwp.trim() === "") return errors; // Opsional

    const cleaned = npwp.replace(/[\.\-\s]/g, "");
    if (!/^\d{15}$/.test(cleaned)) {
      errors.push("NPWP harus 15 digit angka");
    }
    return errors;
  }

  /**
   * Validasi Jam Lembur
   * - Harus angka
   * - Min: 0
   * - Max: 100
   * - Boleh desimal kelipatan 0.5
   */
  function validateJamLembur(jam) {
    const errors = [];
    const num = parseFloat(jam);

    if (jam === "" || jam === null || jam === undefined) {
      errors.push("Jam lembur tidak boleh kosong");
      return errors;
    }
    if (isNaN(num)) {
      errors.push("Jam lembur harus berupa angka");
      return errors;
    }
    if (num < 0) {
      errors.push("Jam lembur tidak boleh negatif");
    }
    if (num > CONSTANTS.MAX_JAM_LEMBUR) {
      errors.push(`Jam lembur maksimal ${CONSTANTS.MAX_JAM_LEMBUR} jam`);
    }
    // Cek kelipatan 0.5
    if ((num * 2) % 1 !== 0) {
      errors.push("Jam lembur harus kelipatan 0.5");
    }

    return errors;
  }

  /**
   * Validasi Hari Absensi
   * - Harus integer
   * - Min: 0
   * - Max: 26 (hari kerja)
   */
  function validateHariAbsensi(hari) {
    const errors = [];
    const num = parseInt(hari, 10);

    if (hari === "" || hari === null || hari === undefined) {
      errors.push("Hari absensi tidak boleh kosong");
      return errors;
    }
    if (isNaN(num)) {
      errors.push("Hari absensi harus berupa angka bulat");
      return errors;
    }
    if (num < 0) {
      errors.push("Hari absensi tidak boleh negatif");
    }
    if (num > CONSTANTS.MAX_HARI_ABSENSI) {
      errors.push(`Hari absensi maksimal ${CONSTANTS.MAX_HARI_ABSENSI} hari`);
    }
    if (num !== parseFloat(hari)) {
      errors.push("Hari absensi harus bilangan bulat");
    }

    return errors;
  }

  /**
   * Validasi lengkap form karyawan.
   * Mengembalikan object { valid: boolean, errors: { field: [messages] } }
   */
  function validateFormKaryawan(data) {
    const allErrors = {};

    const errId = validateIdKaryawan(data.id);
    if (errId.length) allErrors.id = errId;

    const errNama = validateNama(data.nama);
    if (errNama.length) allErrors.nama = errNama;

    const errJabatan = validatePilihan(
      data.jabatan,
      Object.keys(CONSTANTS.TUNJANGAN_JABATAN),
      "Jabatan"
    );
    if (errJabatan.length) allErrors.jabatan = errJabatan;

    const errGolongan = validatePilihan(
      data.golongan,
      Object.keys(CONSTANTS.GAJI_POKOK),
      "Golongan"
    );
    if (errGolongan.length) allErrors.golongan = errGolongan;

    const errStatus = validatePilihan(
      data.status,
      Object.keys(CONSTANTS.MULTIPLIER_STATUS),
      "Status"
    );
    if (errStatus.length) allErrors.status = errStatus;

    const errDept = validatePilihan(
      data.departemen,
      CONSTANTS.DEPARTEMEN,
      "Departemen"
    );
    if (errDept.length) allErrors.departemen = errDept;

    if (data.npwp) {
      const errNpwp = validateNPWP(data.npwp);
      if (errNpwp.length) allErrors.npwp = errNpwp;
    }

    return {
      valid: Object.keys(allErrors).length === 0,
      errors: allErrors,
    };
  }

  /**
   * Validasi form penggajian (lembur + absensi).
   */
  function validateFormPenggajian(data) {
    const allErrors = {};

    const errLembur = validateJamLembur(data.jamLembur);
    if (errLembur.length) allErrors.lembur = errLembur;

    const errAbsensi = validateHariAbsensi(data.hariAbsensi);
    if (errAbsensi.length) allErrors.absensi = errAbsensi;

    return {
      valid: Object.keys(allErrors).length === 0,
      errors: allErrors,
    };
  }

  // ── Public API ──
  return {
    validateIdKaryawan,
    validateNama,
    validatePilihan,
    validateNPWP,
    validateJamLembur,
    validateHariAbsensi,
    validateFormKaryawan,
    validateFormPenggajian,
  };

})();
