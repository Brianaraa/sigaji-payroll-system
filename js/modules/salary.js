/**
 * MODULE: salary.js
 * ============================================================
 * Modul inti perhitungan gaji karyawan.
 * Dirancang dengan fungsi-fungsi terpisah (modular) agar:
 *   - Mudah diuji secara whitebox (flow graph, cyclomatic complexity)
 *   - Mudah diuji secara blackbox (boundary value, equivalence)
 *   - Setiap fungsi punya single responsibility
 * ============================================================
 */

const SalaryCalculator = (() => {

  // ──────────────────────────────────────────
  // 1. GAJI POKOK
  // ──────────────────────────────────────────
  /**
   * Hitung gaji pokok berdasarkan golongan dan status karyawan.
   * Multiplier diberikan berdasarkan status (tetap/kontrak/magang).
   * @param {string} golongan - "I" s/d "V"
   * @param {string} status   - "Tetap" | "Kontrak" | "Magang"
   * @returns {number} Gaji pokok dalam rupiah
   */
  function hitungGajiPokok(golongan, status) {
    if (!golongan || !(golongan in CONSTANTS.GAJI_POKOK)) {
      throw new Error(`Golongan tidak valid: ${golongan}`);
    }
    if (!status || !(status in CONSTANTS.MULTIPLIER_STATUS)) {
      throw new Error(`Status karyawan tidak valid: ${status}`);
    }

    const base = CONSTANTS.GAJI_POKOK[golongan];
    const multiplier = CONSTANTS.MULTIPLIER_STATUS[status];
    return Math.round(base * multiplier);
  }

  // ──────────────────────────────────────────
  // 2. TUNJANGAN
  // ──────────────────────────────────────────
  /**
   * Hitung total tunjangan karyawan.
   * Tunjangan transport dan makan dikurangi untuk karyawan magang.
   * Tunjangan jabatan tidak diberikan kepada karyawan magang.
   * @param {string} jabatan
   * @param {string} status
   * @returns {{ transport: number, makan: number, jabatan: number, total: number }}
   */
  function hitungTunjangan(jabatan, status) {
    if (!jabatan || !(jabatan in CONSTANTS.TUNJANGAN_JABATAN)) {
      throw new Error(`Jabatan tidak valid: ${jabatan}`);
    }

    let transport, makan, tunjanganJabatan;

    if (status === "Magang") {
      transport = CONSTANTS.TUNJANGAN_TRANSPORT_MAGANG;
      makan = CONSTANTS.TUNJANGAN_MAKAN_MAGANG;
      tunjanganJabatan = 0; // Magang tidak dapat tunjangan jabatan
    } else if (status === "Kontrak") {
      transport = CONSTANTS.TUNJANGAN_TRANSPORT;
      makan = CONSTANTS.TUNJANGAN_MAKAN;
      tunjanganJabatan = Math.round(CONSTANTS.TUNJANGAN_JABATAN[jabatan] * 0.5);
    } else {
      // Tetap
      transport = CONSTANTS.TUNJANGAN_TRANSPORT;
      makan = CONSTANTS.TUNJANGAN_MAKAN;
      tunjanganJabatan = CONSTANTS.TUNJANGAN_JABATAN[jabatan];
    }

    const total = transport + makan + tunjanganJabatan;

    return { transport, makan, jabatan: tunjanganJabatan, total };
  }

  // ──────────────────────────────────────────
  // 3. LEMBUR
  // ──────────────────────────────────────────
  /**
   * Hitung upah lembur.
   * Rumus: (Gaji Pokok / 173) × 1.5 × Jam Lembur
   * @param {number} gajiPokok - Gaji pokok per bulan
   * @param {number} jamLembur - Jumlah jam lembur
   * @returns {number} Upah lembur
   * @throws Error jika jam lembur di luar batas
   */
  function hitungLembur(gajiPokok, jamLembur) {
    if (typeof jamLembur !== "number" || isNaN(jamLembur)) {
      throw new Error("Jam lembur harus berupa angka");
    }
    if (jamLembur < 0) {
      throw new Error("Jam lembur tidak boleh negatif");
    }
    if (jamLembur > CONSTANTS.MAX_JAM_LEMBUR) {
      throw new Error(`Jam lembur melebihi batas maksimal (${CONSTANTS.MAX_JAM_LEMBUR} jam)`);
    }

    if (jamLembur === 0) return 0;

    const tarifPerJam = gajiPokok / CONSTANTS.JAM_KERJA_BULANAN;
    const tarifLembur = tarifPerJam * CONSTANTS.FAKTOR_LEMBUR;
    return Math.round(tarifLembur * jamLembur);
  }

  // ──────────────────────────────────────────
  // 4. POTONGAN BPJS
  // ──────────────────────────────────────────
  /**
   * Hitung potongan BPJS.
   * Karyawan magang: hanya BPJS Kesehatan, tidak ada BPJS Ketenagakerjaan.
   * @param {number} gajiPokok
   * @param {string} status
   * @returns {{ kesehatan: number, ketenagakerjaan: number, total: number }}
   */
  function hitungBPJS(gajiPokok, status) {
    // Basis perhitungan BPJS Kesehatan dibatasi
    const basisKesehatan = Math.min(gajiPokok, CONSTANTS.BPJS_MAX_GAJI);
    const kesehatan = Math.round(basisKesehatan * CONSTANTS.BPJS_KESEHATAN_PERSEN);

    let ketenagakerjaan = 0;
    if (status !== "Magang") {
      ketenagakerjaan = Math.round(gajiPokok * CONSTANTS.BPJS_KETENAGAKERJAAN_PERSEN);
    }

    const total = kesehatan + ketenagakerjaan;
    return { kesehatan, ketenagakerjaan, total };
  }

  // ──────────────────────────────────────────
  // 5. POTONGAN ABSENSI
  // ──────────────────────────────────────────
  /**
   * Hitung potongan akibat ketidakhadiran.
   * Rumus: (Gaji Pokok / Hari Kerja) × Hari Absensi
   * @param {number} gajiPokok
   * @param {number} hariAbsensi - Jumlah hari tidak hadir
   * @returns {number} Total potongan absensi
   */
  function hitungPotonganAbsensi(gajiPokok, hariAbsensi) {
    if (typeof hariAbsensi !== "number" || isNaN(hariAbsensi)) {
      throw new Error("Hari absensi harus berupa angka");
    }
    if (hariAbsensi < 0) {
      throw new Error("Hari absensi tidak boleh negatif");
    }
    if (hariAbsensi > CONSTANTS.MAX_HARI_ABSENSI) {
      throw new Error(`Hari absensi melebihi hari kerja (${CONSTANTS.MAX_HARI_ABSENSI} hari)`);
    }

    if (hariAbsensi === 0) return 0;

    const potonganPerHari = gajiPokok / CONSTANTS.HARI_KERJA_BULANAN;
    return Math.round(potonganPerHari * hariAbsensi);
  }

  // ──────────────────────────────────────────
  // 6. PPh 21
  // ──────────────────────────────────────────
  /**
   * Hitung PPh 21 menggunakan bracket pajak progresif (UU HPP 2021).
   * Banyak percabangan if/else — ideal untuk whitebox testing.
   *
   * Alur:
   * 1. Hitung penghasilan bruto setahun
   * 2. Kurangi biaya jabatan (5%, maks 6jt/tahun)
   * 3. Kurangi PTKP sesuai status
   * 4. Hasil = PKP (Penghasilan Kena Pajak)
   * 5. Aplikasikan tarif progresif
   * 6. Bagi 12 untuk PPh bulanan
   *
   * @param {number} penghasilanBrutoPerBulan - Total bruto (gaji+tunjangan)
   * @param {string} statusPTKP - Kode PTKP: "TK0", "K1", dsb.
   * @returns {{ pkpTahunan: number, pajakTahunan: number, pajakBulanan: number, detail: Array }}
   */
  function hitungPPh21(penghasilanBrutoPerBulan, statusPTKP) {
    // Validasi input
    if (typeof penghasilanBrutoPerBulan !== "number" || isNaN(penghasilanBrutoPerBulan)) {
      throw new Error("Penghasilan bruto harus berupa angka");
    }
    if (penghasilanBrutoPerBulan < 0) {
      throw new Error("Penghasilan bruto tidak boleh negatif");
    }
    if (!statusPTKP || !(statusPTKP in CONSTANTS.PTKP)) {
      throw new Error(`Status PTKP tidak valid: ${statusPTKP}`);
    }

    // Step 1: Bruto tahunan
    const brutoTahunan = penghasilanBrutoPerBulan * 12;

    // Step 2: Biaya jabatan
    const biayaJabatan = Math.min(
      brutoTahunan * CONSTANTS.BIAYA_JABATAN_PERSEN,
      CONSTANTS.BIAYA_JABATAN_MAX
    );

    // Step 3: Penghasilan neto
    const netoTahunan = brutoTahunan - biayaJabatan;

    // Step 4: PTKP
    const ptkp = CONSTANTS.PTKP[statusPTKP];

    // Step 5: PKP (tidak boleh negatif)
    const pkpTahunan = Math.max(0, netoTahunan - ptkp);

    // Step 6: Hitung pajak progresif dengan bracket
    const detail = [];
    let sisaPKP = pkpTahunan;
    let pajakTahunan = 0;

    for (const bracket of CONSTANTS.PPH21_BRACKETS) {
      if (sisaPKP <= 0) break;

      const { batas_bawah, batas_atas, tarif } = bracket;
      const rentang = batas_atas - batas_bawah;
      const kenaHitungBracket = Math.min(sisaPKP, rentang);

      if (kenaHitungBracket <= 0) continue;

      const pajakBracket = kenaHitungBracket * tarif;
      pajakTahunan += pajakBracket;

      detail.push({
        label: `PKP Rp${Formatter.angka(batas_bawah)} – Rp${batas_atas === Infinity ? '∞' : Formatter.angka(batas_atas)}`,
        tarif: `${(tarif * 100).toFixed(0)}%`,
        dasar: kenaHitungBracket,
        pajak: pajakBracket,
      });

      sisaPKP -= kenaHitungBracket;
    }

    const pajakBulanan = Math.round(pajakTahunan / 12);

    return {
      brutoTahunan,
      biayaJabatan,
      netoTahunan,
      ptkp,
      pkpTahunan,
      pajakTahunan: Math.round(pajakTahunan),
      pajakBulanan,
      detail,
    };
  }

  // ──────────────────────────────────────────
  // 7. HITUNG GAJI LENGKAP (Orchestrator)
  // ──────────────────────────────────────────
  /**
   * Fungsi utama yang memanggil semua sub-fungsi perhitungan.
   * Menggabungkan semua komponen menjadi satu hasil slip gaji.
   *
   * @param {Object} karyawan - Data karyawan
   * @param {number} jamLembur
   * @param {number} hariAbsensi
   * @returns {Object} Hasil perhitungan lengkap
   */
  function hitungGajiLengkap(karyawan, jamLembur = 0, hariAbsensi = 0) {
    // Ambil komponen gaji
    const gajiPokok = hitungGajiPokok(karyawan.golongan, karyawan.status);
    const tunjangan = hitungTunjangan(karyawan.jabatan, karyawan.status);
    const upahLembur = hitungLembur(gajiPokok, jamLembur);
    const bpjs = hitungBPJS(gajiPokok, karyawan.status);
    const potonganAbsensi = hitungPotonganAbsensi(gajiPokok, hariAbsensi);

    // Penghasilan bruto untuk PPh 21
    const penghasilanBruto = gajiPokok + tunjangan.total + upahLembur;

    // PPh 21 (magang tidak kena pajak karena penghasilan rendah, tapi tetap dihitung)
    const statusPTKP = karyawan.ptkp || "TK0";
    const pph21 = hitungPPh21(penghasilanBruto, statusPTKP);

    // Total potongan
    const totalPotongan = bpjs.total + pph21.pajakBulanan + potonganAbsensi;

    // Gaji bersih
    const gajiBersih = penghasilanBruto - totalPotongan;

    return {
      // Input
      idKaryawan: karyawan.id,
      namaKaryawan: karyawan.nama,
      jabatan: karyawan.jabatan,
      golongan: karyawan.golongan,
      status: karyawan.status,
      departemen: karyawan.departemen,
      jamLembur,
      hariAbsensi,

      // Komponen
      gajiPokok,
      tunjangan,
      upahLembur,
      penghasilanBruto,

      // Potongan
      bpjs,
      pph21,
      potonganAbsensi,
      totalPotongan,

      // Hasil
      gajiBersih: Math.max(0, gajiBersih), // Gaji bersih tidak bisa negatif

      // Metadata
      dihitungPada: new Date().toISOString(),
    };
  }

  // ── Public API ──
  return {
    hitungGajiPokok,
    hitungTunjangan,
    hitungLembur,
    hitungBPJS,
    hitungPotonganAbsensi,
    hitungPPh21,
    hitungGajiLengkap,
  };

})();
