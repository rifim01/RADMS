/**
 * RIFIM PAYROLL & HR MANAGEMENT SYSTEM
 * Code.gs — Main entry point & HTTP router
 *
 * Deploy sebagai Google Apps Script Web App:
 *   Execute as: Me | Access: Anyone (anonymous)
 *
 * Script Properties yang wajib di-set:
 *   PAYROLL_SPREADSHEET_ID  — ID Google Sheets database payroll
 *   TOKEN_SECRET            — secret key untuk sign token (min 32 char)
 */

// ─── Spreadsheet Config ───────────────────────────────────────────────────────

var PAYROLL_SS_ID = PropertiesService.getScriptProperties().getProperty('PAYROLL_SPREADSHEET_ID');
var PSS; // lazy-loaded

function getDB() {
  if (!PSS) PSS = SpreadsheetApp.openById(PAYROLL_SS_ID);
  return PSS;
}

// Sheet name constants
var PSHEET = {
  STAFF:           'STAFF',
  ABSENSI:         'ABSENSI',
  PAYROLL:         'PAYROLL',
  PAYROLL_DETAIL:  'PAYROLL_DETAIL',
  LEMBUR:          'LEMBUR',
  KASBON:          'KASBON',
  CUTI:            'CUTI',
  CABANG:          'CABANG',
  TOKENS:          'PR_TOKENS'
};

// Master cabang — source of truth jika sheet CABANG belum diisi
var MASTER_CABANG = [
  { id: 'BTM-APT', nama: 'ID Rifim Airport Batam' },
  { id: 'JMB-APT', nama: 'ID Rifim Airport Jambi' },
  { id: 'BPN-APT', nama: 'ID Rifim Airport Balikpapan' },
  { id: 'MDO-APT', nama: 'ID Rifim Airport Manado' },
  { id: 'PKU-APT', nama: 'ID Rifim Airport Pekanbaru' },
  { id: 'MKS-APT', nama: 'ID Rifim Airport Makassar' },
  { id: 'BTM-OFF', nama: 'ID Rifim Batam' },
  { id: 'JMB-OFF', nama: 'ID Rifim Jambi Luar' }
];

// ID Spreadsheet eksternal
var SS_MASTER_STAFF   = '1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw';
var SS_ERP_ABSENSI    = '1FU5hKMpYn1qhsl4-xZYUZrXDhTOV6aRRewYEs6gIkxA';

// ─── HTTP Entry Points ────────────────────────────────────────────────────────

function doPost(e) {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    var p = JSON.parse(e.postData.contents);
    if (!p.action) return out.setContent(_err('Missing action'));

    // Login tidak perlu token
    if (p.action === 'login') return out.setContent(JSON.stringify(prLogin(p.email, p.password)));

    // Semua action lain wajib token
    var auth = prVerifyToken(p.token);
    if (!auth.valid) return out.setContent(_err('Unauthorized: ' + auth.reason));

    var result = _routePost(p.action, p, auth);
    return out.setContent(JSON.stringify(result));
  } catch (err) {
    Logger.log('doPost: ' + err.message + '\n' + err.stack);
    return out.setContent(_err('Server error: ' + err.message));
  }
}

function doGet(e) {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    var p = e.parameter || {};
    if (!p.action) return out.setContent(JSON.stringify({
      success: true, message: 'RIFIM Payroll API v1.0', ts: new Date().toISOString()
    }));

    if (p.action === 'getCabang') return out.setContent(JSON.stringify(getCabang()));

    var auth = prVerifyToken(p.token);
    if (!auth.valid) return out.setContent(_err('Unauthorized: ' + auth.reason));

    var result = _routeGet(p.action, p, auth);
    return out.setContent(JSON.stringify(result));
  } catch (err) {
    Logger.log('doGet: ' + err.message + '\n' + err.stack);
    return out.setContent(_err('Server error: ' + err.message));
  }
}

// ─── POST Router ──────────────────────────────────────────────────────────────

function _routePost(action, p, auth) {
  // Staff
  if (action === 'addStaff')    return addStaff(p.data, auth);
  if (action === 'updateStaff') return updateStaff(p.id, p.data, auth);
  if (action === 'deleteStaff') return deleteStaff(p.id, auth);

  // Absensi
  if (action === 'addAbsensi')       return addAbsensi(p.data, auth);
  if (action === 'bulkHadir')        return bulkHadir(p.idCabang, p.tanggal, auth);

  // Payroll
  if (action === 'generatePayroll')  return generatePayroll(p.periode, p.idCabang, auth);
  if (action === 'updatePayrollDetail') return updatePayrollDetail(p.id, p.data, auth);
  if (action === 'finalizePayroll')  return finalizePayroll(p.payrollId, auth);
  if (action === 'generateSlipPDF')  return generateSlipPDF(p.detailId, auth);
  if (action === 'generateAllSlips') return generateAllSlips(p.payrollId, auth);

  // Lembur
  if (action === 'addLembur')    return addLembur(p.data, auth);
  if (action === 'approveLembur') return approveLembur(p.id, auth);
  if (action === 'rejectLembur') return rejectLembur(p.id, auth);

  // Kasbon
  if (action === 'addKasbon')    return addKasbon(p.data, auth);

  // Cuti
  if (action === 'ajukanCuti')   return ajukanCuti(p.data, auth);
  if (action === 'approveCuti')  return approveCuti(p.id, auth);
  if (action === 'rejectCuti')   return rejectCuti(p.id, p.alasan, auth);

  // ID Card
  if (action === 'generateIDCard') return generateIDCard(p.idStaff, auth);

  // Sync eksternal
  if (action === 'syncStaffFromMaster') return syncStaffFromMaster(auth);
  if (action === 'syncAbsensiFromERP')  return syncAbsensiFromERP(p.tanggalMulai, p.tanggalSelesai, auth);

  // Auth — ganti password
  if (action === 'gantiPassword') return gantiPassword(p.passwordLama, p.passwordBaru, auth);

  return { success: false, error: 'Unknown action: ' + action };
}

// ─── GET Router ───────────────────────────────────────────────────────────────

function _routeGet(action, p, auth) {
  // Staff
  if (action === 'getStaff')       return getStaffList(p.idCabang, auth);
  if (action === 'getStaffById')   return getStaffById(p.id, auth);

  // Absensi
  if (action === 'getAbsensi')     return getAbsensi(p.idCabang, p.startDate, p.endDate, auth);
  if (action === 'getSummaryAbsensi') return getSummaryAbsensi(p.idCabang, p.tanggal, auth);

  // Payroll
  if (action === 'getPayrollRuns')   return getPayrollRuns(p.idCabang, p.tahun, auth);
  if (action === 'getPayrollDetail') return getPayrollDetail(p.payrollId, auth);
  if (action === 'getPayrollSlip')   return getPayrollSlip(p.idStaff, p.periode, auth);

  // Lembur
  if (action === 'getLembur')  return getLembur(p.idCabang, p.periode, auth);

  // Kasbon
  if (action === 'getKasbon')   return getKasbon(p.idStaff, auth);
  if (action === 'getAllKasbon') return getAllKasbon(p.idCabang, auth);

  // Cuti
  if (action === 'getCuti')    return getCutiList(p.idCabang, p.status, auth);
  if (action === 'getCutiKuota') return getCutiKuota(p.idStaff, p.tahun, auth);

  // Dashboard
  if (action === 'getDashboard') return getDashboard(p.idCabang, p.tanggal, auth);

  // Report
  if (action === 'getReport') return getReport(p.type, p.idCabang, p.startDate, p.endDate, auth);

  return { success: false, error: 'Unknown action: ' + action };
}

// ─── Shared Utilities ─────────────────────────────────────────────────────────

function getSheet(name) {
  var s = getDB().getSheetByName(name);
  if (!s) throw new Error('Sheet tidak ditemukan: ' + name);
  return s;
}

function sheetToObjects(name) {
  var s    = getSheet(name);
  var data = s.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(name, obj, headers) {
  var s   = getSheet(name);
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  s.appendRow(row);
  return obj;
}

function updateRow(name, keyCol, keyVal, obj) {
  var s       = getSheet(name);
  var data    = s.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var colIdx  = headers.indexOf(keyCol);
  if (colIdx < 0) throw new Error('Kolom tidak ditemukan: ' + keyCol);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]).trim() === String(keyVal).trim()) {
      Object.keys(obj).forEach(function(k) {
        var ci = headers.indexOf(k);
        if (ci >= 0) s.getRange(i + 1, ci + 1).setValue(obj[k]);
      });
      return true;
    }
  }
  return false;
}

function deleteRow(name, keyCol, keyVal) {
  var s       = getSheet(name);
  var data    = s.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var colIdx  = headers.indexOf(keyCol);
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIdx]).trim() === String(keyVal).trim()) {
      s.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function generateId() { return Utilities.getUuid(); }

function formatDate(d) {
  var date = d ? (d instanceof Date ? d : new Date(d)) : new Date();
  return Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd');
}

function formatDateTime(d) {
  var date = d ? (d instanceof Date ? d : new Date(d)) : new Date();
  return Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
}

function _err(msg) {
  return JSON.stringify({ success: false, error: msg });
}

// ─── Master Cabang ────────────────────────────────────────────────────────────

function getCabang() {
  try {
    var rows = sheetToObjects(PSHEET.CABANG).filter(function(r) { return r.status !== 'NONAKTIF'; });
    if (rows.length > 0) return { success: true, data: rows };
  } catch (e) { /* sheet belum ada, pakai master */ }
  return { success: true, data: MASTER_CABANG };
}

// ─── Permission Guard ─────────────────────────────────────────────────────────

function _canManageCabang(auth, idCabang) {
  if (auth.role === 'OWNER' || auth.role === 'SUPER_ADMIN') return true;
  return auth.idCabang === idCabang;
}

// ─── syncStaffFromMaster dipindah ke Staff.gs (versi user) ──────────────────
// Fungsi ini sekarang ada di Staff.gs dengan baca sheet "MASTER DATA STAFF"
// by name dan kolom: email[0],nama[1],gapok[2],id_cabang[3],id[4],jabatan[5]

// ─── Get All Kasbon (satu call, lebih cepat dari N+1) ────────────────────────

function getAllKasbon(idCabang, auth) {
  var list = sheetToObjects(PSHEET.KASBON);
  if (idCabang) {
    list = list.filter(function(k) { return k.id_cabang === idCabang; });
  } else if (auth.role !== 'OWNER' && auth.role !== 'SUPER_ADMIN') {
    list = list.filter(function(k) { return k.id_cabang === auth.idCabang; });
  }
  list.sort(function(a, b) { return String(b.tanggal).localeCompare(String(a.tanggal)); });
  return { success: true, data: list };
}

// ─── Sync Absensi dari RIFIM ERP ABSENSI sheet (Point 7) ─────────────────────

function syncAbsensiFromERP(tanggalMulai, tanggalSelesai, auth) {
  if (auth.role !== 'OWNER' && auth.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Hanya Owner/Super Admin yang bisa sync absensi' };
  }

  try {
    var ss    = SpreadsheetApp.openById(SS_ERP_ABSENSI);
    var sheet = ss.getSheetByName('ABSENSI') || ss.getSheets()[0];
    var data  = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: false, error: 'Sheet ABSENSI kosong' };

    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var existing = sheetToObjects(PSHEET.ABSENSI);
    var existingKeys = existing.map(function(a) { return a.id_staff + '_' + a.tanggal; });

    var added = 0, skipped = 0;
    var startD = tanggalMulai ? new Date(tanggalMulai) : null;
    var endD   = tanggalSelesai ? new Date(tanggalSelesai) : null;

    var ABSENSI_H = ['id','id_staff','nama','id_cabang','tanggal','jam_masuk','jam_keluar','status','keterangan','created_at'];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      headers.forEach(function(h, idx) { obj[h] = row[idx]; });

      var tgl      = obj['tanggal'] || obj['date'] || '';
      var idStaff  = obj['id_staff'] || obj['id staff'] || '';
      var nama     = obj['nama'] || obj['name'] || '';
      var cabang   = obj['id_cabang'] || obj['cabang'] || '';
      var status   = obj['status'] || 'HADIR';
      var jamMasuk = obj['jam_masuk'] || obj['jam masuk'] || '';
      var jamKeluar= obj['jam_keluar'] || obj['jam keluar'] || '';

      if (!tgl || !idStaff) { skipped++; continue; }

      // Filter tanggal
      if (startD || endD) {
        var tglDate = new Date(tgl);
        if (startD && tglDate < startD) { skipped++; continue; }
        if (endD   && tglDate > endD)   { skipped++; continue; }
      }

      var key = idStaff + '_' + formatDate(new Date(tgl));
      if (existingKeys.indexOf(key) !== -1) { skipped++; continue; }

      var rec = {
        id:         generateId(),
        id_staff:   String(idStaff),
        nama:       String(nama),
        id_cabang:  String(cabang),
        tanggal:    formatDate(new Date(tgl)),
        jam_masuk:  String(jamMasuk),
        jam_keluar: String(jamKeluar),
        status:     String(status).toUpperCase(),
        keterangan: '',
        created_at: formatDateTime()
      };

      appendRow(PSHEET.ABSENSI, rec, ABSENSI_H);
      existingKeys.push(key);
      added++;
    }

    return { success: true, message: 'Sync absensi selesai: ' + added + ' record ditambahkan, ' + skipped + ' dilewati' };
  } catch (e) {
    return { success: false, error: 'Gagal sync absensi: ' + e.message };
  }
}
