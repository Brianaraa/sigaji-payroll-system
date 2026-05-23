/**
 * UTIL: formatter.js
 * Fungsi pemformatan tampilan (currency, tanggal, dll.)
 */

const Formatter = (() => {

  /**
   * Format angka ke format mata uang Rupiah
   * @param {number} value
   * @returns {string} "Rp 1.500.000"
   */
  function rupiah(value) {
    if (value === null || value === undefined || isNaN(value)) return "Rp 0";
    return "Rp " + Math.round(value).toLocaleString("id-ID");
  }

  /**
   * Format angka dengan separator titik
   * @param {number} value
   * @returns {string} "1.500.000"
   */
  function angka(value) {
    if (value === null || value === undefined || isNaN(value)) return "0";
    return Math.round(value).toLocaleString("id-ID");
  }

  /**
   * Format persen
   * @param {number} value - Decimal (0.05)
   * @returns {string} "5%"
   */
  function persen(value) {
    return (value * 100).toFixed(1).replace(".0", "") + "%";
  }

  /**
   * Format bulan dan tahun ke string Indonesia
   * @param {number} bulan - 1-12
   * @param {number} tahun
   * @returns {string} "Januari 2025"
   */
  function periodeGaji(bulan, tahun) {
    return `${CONSTANTS.BULAN[bulan - 1]} ${tahun}`;
  }

  /**
   * Format tanggal ISO ke string Indonesia
   * @param {string} isoString
   * @returns {string} "12 Maret 2025"
   */
  function tanggal(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  /**
   * Singkat angka besar: 1.5jt, 250rb
   */
  function singkat(value) {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "M";
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "jt";
    if (value >= 1_000) return (value / 1_000).toFixed(0) + "rb";
    return value.toString();
  }

  return { rupiah, angka, persen, periodeGaji, tanggal, singkat };

})();
