/**
 * RADMS - JadwalKerja.gs
 * Mencatat aktivitas staff (panggil / selesai antrian) ke sheet JADWAL KERJA
 * di spreadsheet RIFIM ERP ABSENSI.
 *
 * Sheet JADWAL KERJA kolom: Nama | Cabang | Jabatan | Shift | Tanggal
 */

var ABSENSI_SS_ID     = '1FU5hKMpYn1qhsl4-xZYUZrXDhTOV6aRRewYEs6gIkxA';
var JADWAL_SHEET_NAME = 'JADWAL KERJA';

/**
 * Log satu baris ke JADWAL KERJA.
 * Deduplication: skip jika (Nama + Cabang + Shift + Tanggal) sudah ada → satu baris per shift per hari.
 *
 * @param {string} nama     - Nama staff (dari user.name)
 * @param {string} cabang   - Branch / airport ID
 * @param {string} jabatan  - Jabatan / role staff
 * @param {string} shift    - PAGI | MIDDLE | SIANG
 * @param {string} tanggal  - YYYY-MM-DD
 * @returns {{ success: boolean, duplicate?: boolean }}
 */
function logJadwalKerja(nama, cabang, jabatan, shift, tanggal) {
  try {
    if (!nama || !cabang) return { success: false, error: 'nama dan cabang wajib diisi' };

    var ss    = SpreadsheetApp.openById(ABSENSI_SS_ID);
    var sheet = ss.getSheetByName(JADWAL_SHEET_NAME);
    if (!sheet) return { success: false, error: 'Sheet JADWAL KERJA tidak ditemukan' };

    var today = tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // Cek duplikasi — satu baris per (Nama, Cabang, Shift, Tanggal)
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (
        String(row[0]).trim() === nama  &&
        String(row[1]).trim() === cabang &&
        String(row[3]).trim() === shift  &&
        String(row[4]).substring(0, 10) === today
      ) {
        return { success: true, duplicate: true };
      }
    }

    sheet.appendRow([nama, cabang, jabatan || '', shift || '', today]);
    return { success: true };

  } catch (err) {
    Logger.log('logJadwalKerja error: ' + err.message);
    return { success: false, error: err.message };
  }
}
