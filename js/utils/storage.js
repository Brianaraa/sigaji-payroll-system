/**
 * UTIL: storage.js
 * Abstraksi localStorage agar mudah diuji dan diganti backend.
 */

const Storage = (() => {

  const KEYS = {
    KARYAWAN: "sigaji_karyawan",
    PENGGAJIAN: "sigaji_penggajian",
  };

  function _get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Storage read error:", e);
      return [];
    }
  }

  function _set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Storage write error:", e);
      return false;
    }
  }

  // ── KARYAWAN ──
  function getAllKaryawan() { return _get(KEYS.KARYAWAN); }

  function getKaryawanById(id) {
    return getAllKaryawan().find(k => k.id === id) || null;
  }

  function saveKaryawan(karyawan) {
    const data = getAllKaryawan();
    const idx = data.findIndex(k => k.id === karyawan.id);
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...karyawan };
    } else {
      karyawan.createdAt = new Date().toISOString();
      data.push(karyawan);
    }
    return _set(KEYS.KARYAWAN, data);
  }

  function deleteKaryawan(id) {
    const data = getAllKaryawan().filter(k => k.id !== id);
    return _set(KEYS.KARYAWAN, data);
  }

  function isIdExists(id, excludeId = null) {
    return getAllKaryawan().some(k => k.id === id && k.id !== excludeId);
  }

  // ── PENGGAJIAN ──
  function getAllPenggajian() { return _get(KEYS.PENGGAJIAN); }

  function getPenggajian(idKaryawan, bulan, tahun) {
    return getAllPenggajian().find(
      p => p.idKaryawan === idKaryawan && p.bulan === bulan && p.tahun === tahun
    ) || null;
  }

  function savePenggajian(data) {
    const all = getAllPenggajian();
    const key = p => `${p.idKaryawan}_${p.bulan}_${p.tahun}`;
    const idx = all.findIndex(p => key(p) === key(data));
    if (idx >= 0) {
      all[idx] = data;
    } else {
      all.push(data);
    }
    return _set(KEYS.PENGGAJIAN, all);
  }

  function getPenggajianByBulan(bulan, tahun, departemen = "") {
    let data = getAllPenggajian().filter(p => p.bulan === bulan && p.tahun === tahun);
    if (departemen) {
      data = data.filter(p => p.departemen === departemen);
    }
    return data;
  }

  function clearAll() {
    localStorage.removeItem(KEYS.KARYAWAN);
    localStorage.removeItem(KEYS.PENGGAJIAN);
  }

  // ── SEED DATA (untuk demo/stress test) ──
  function seedDemoData(jumlah = 20) {
    const jabatans = Object.keys(CONSTANTS.TUNJANGAN_JABATAN);
    const golongans = Object.keys(CONSTANTS.GAJI_POKOK);
    const statuses = Object.keys(CONSTANTS.MULTIPLIER_STATUS);
    const ptkps = Object.keys(CONSTANTS.PTKP);

    const karyawanList = [];
    for (let i = 1; i <= jumlah; i++) {
      const jabatan = jabatans[i % jabatans.length];
      const golongan = golongans[i % golongans.length];
      const status = statuses[i % statuses.length];
      const dept = CONSTANTS.DEPARTEMEN[i % CONSTANTS.DEPARTEMEN.length];
      const ptkp = ptkps[i % ptkps.length];

      karyawanList.push({
        id: `KRY-${String(i).padStart(3, "0")}`,
        nama: `Karyawan Demo ${i}`,
        jabatan,
        golongan,
        status,
        departemen: dept,
        ptkp,
        npwp: "",
        createdAt: new Date().toISOString(),
      });
    }

    _set(KEYS.KARYAWAN, karyawanList);
    return karyawanList.length;
  }

  return {
    getAllKaryawan,
    getKaryawanById,
    saveKaryawan,
    deleteKaryawan,
    isIdExists,
    getAllPenggajian,
    getPenggajian,
    savePenggajian,
    getPenggajianByBulan,
    clearAll,
    seedDemoData,
    KEYS,
  };

})();
