/**
 * PDF.gs — Generate Slip Gaji, Rekap Payroll, ID Card
 *
 * Output disimpan ke Google Drive folder RIFIM_PAYROLL_PDF.
 * Script Property: PDF_FOLDER_ID (opsional, jika tidak ada maka buat otomatis)
 */

// ─── Slip Gaji per Staff ──────────────────────────────────────────────────────

function generateSlipPDF(detailId, auth) {
  var details = sheetToObjects(PSHEET.PAYROLL_DETAIL);
  var detail  = details.find(function(d) { return d.id === detailId; });
  if (!detail) return { success: false, error: 'Detail tidak ditemukan' };

  var html    = _buildSlipHTML(detail);
  var pdfBlob = _htmlToPDF(html, 'Slip-' + detail.nama + '-' + detail.periode + '.pdf');

  var folder  = _getPDFFolder();
  var file    = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  updateRow(PSHEET.PAYROLL_DETAIL, 'id', detailId, { slip_pdf_url: url });

  return { success: true, url: url, fileId: file.getId() };
}

function generateAllSlips(payrollId, auth) {
  var details = sheetToObjects(PSHEET.PAYROLL_DETAIL).filter(function(d) {
    return d.payroll_id === payrollId;
  });
  if (details.length === 0) return { success: false, error: 'Tidak ada detail payroll' };

  var results = details.map(function(d) { return generateSlipPDF(d.id, auth); });
  var success = results.filter(function(r) { return r.success; }).length;

  return { success: true, message: success + '/' + details.length + ' slip berhasil digenerate', results: results };
}

// ─── ID Card ──────────────────────────────────────────────────────────────────

function generateIDCard(idStaff, auth) {
  var staffList = sheetToObjects(PSHEET.STAFF);
  var staff     = staffList.find(function(s) { return s.id === idStaff; });
  if (!staff) return { success: false, error: 'Staff tidak ditemukan' };

  var html    = _buildIDCardHTML(staff);
  var pdfBlob = _htmlToPDF(html, 'IDCard-' + staff.nama + '.pdf');

  var folder  = _getPDFFolder();
  var file    = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  updateRow(PSHEET.STAFF, 'id', idStaff, { id_card_url: url });

  return { success: true, url: url, fileId: file.getId() };
}

// ─── Report PDF ───────────────────────────────────────────────────────────────

function generateReportPDF(type, idCabang, startDate, endDate, auth) {
  var html    = _buildReportHTML(type, idCabang, startDate, endDate, auth);
  var pdfBlob = _htmlToPDF(html, 'Report-' + type + '-' + startDate + '.pdf');

  var folder  = _getPDFFolder();
  var file    = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return { success: true, url: 'https://drive.google.com/file/d/' + file.getId() + '/view' };
}

// ─── HTML Templates ───────────────────────────────────────────────────────────

function _buildSlipHTML(d) {
  var tgl = new Date();
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:20px;color:#333}' +
    '.header{background:#CC0000;color:white;padding:15px;text-align:center;border-radius:8px}' +
    '.header h2{margin:0;font-size:18px}.header p{margin:4px 0;font-size:12px}' +
    '.body{padding:15px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}' +
    '.label{color:#666}.value{font-weight:bold}' +
    '.section-title{background:#FFC107;color:#333;padding:6px 10px;margin:10px 0;font-weight:bold;font-size:13px}' +
    '.total-row{display:flex;justify-content:space-between;padding:8px;background:#CC0000;color:white;border-radius:5px;margin-top:10px}' +
    '.total-label{font-size:14px}.total-value{font-size:16px;font-weight:bold}' +
    '.footer{text-align:center;margin-top:20px;font-size:10px;color:#999}' +
    '</style></head><body>' +
    '<div class="header"><h2>SLIP GAJI KARYAWAN</h2><p>PT RIFIM GEMILANG</p>' +
    '<p>Periode: ' + _formatPeriode(d.periode) + '</p></div>' +
    '<div class="body">' +
    '<div class="section-title">DATA KARYAWAN</div>' +
    _row('Nama',     d.nama) +
    _row('Jabatan',  d.jabatan) +
    _row('Cabang',   d.id_cabang) +
    _row('ID Staff', d.id_staff) +
    '<div class="section-title">PENGHASILAN</div>' +
    _row('Gaji Pokok',    _rp(d.gapok)) +
    _row('BPJS',          _rp(d.bpjs)) +
    _row('Data/Pulsa',    _rp(d.data_pulsa)) +
    _row('Bonus Target',  _rp(d.bonus_target)) +
    _row('Lembur',        _rp(d.total_lembur)) +
    _rowBold('Total Penghasilan', _rp(d.gaji_kotor)) +
    '<div class="section-title">POTONGAN</div>' +
    _row('Kasbon',        _rp(d.kasbon)) +
    _row('Potongan Alpha', _rp(d.potongan_alpha)) +
    _row('Denda Telat',   _rp(d.denda_telat)) +
    _rowBold('Total Potongan', _rp(d.total_potongan)) +
    '<div class="total-row"><span class="total-label">GAJI BERSIH</span>' +
    '<span class="total-value">' + _rp(d.gaji_bersih) + '</span></div>' +
    '</div>' +
    '<div class="footer">Digenerate otomatis oleh RIFIM Payroll System · ' +
    Utilities.formatDate(tgl, 'Asia/Jakarta', 'dd MMM yyyy HH:mm') + '</div>' +
    '</body></html>';
}

function _buildIDCardHTML(staff) {
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=' + encodeURIComponent(staff.id);
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' +
    'body{margin:0;padding:10px;font-family:Arial,sans-serif}' +
    '.card{width:340px;height:200px;background:linear-gradient(135deg,#CC0000,#8B0000);border-radius:12px;' +
    'color:white;padding:15px;box-sizing:border-box;position:relative}' +
    '.logo{font-size:20px;font-weight:bold;color:#FFC107;letter-spacing:2px}' +
    '.company{font-size:10px;color:rgba(255,255,255,0.8);margin-top:2px}' +
    '.info{margin-top:15px}.nama{font-size:16px;font-weight:bold}' +
    '.jabatan{font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px}' +
    '.id-staff{font-size:10px;color:#FFC107;margin-top:4px}' +
    '.cabang{font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px}' +
    '.qr{position:absolute;right:15px;top:15px;background:white;padding:4px;border-radius:4px}' +
    '.strip{position:absolute;bottom:0;left:0;right:0;height:30px;background:#FFC107;' +
    'border-radius:0 0 12px 12px;display:flex;align-items:center;padding:0 15px}' +
    '.strip-text{font-size:9px;color:#333;font-weight:bold}' +
    '</style></head><body>' +
    '<div class="card">' +
    '<div class="logo">RIFIM</div>' +
    '<div class="company">PT RIFIM GEMILANG</div>' +
    '<img class="qr" src="' + qrUrl + '" width="80" height="80" alt="QR">' +
    '<div class="info">' +
    '<div class="nama">' + (staff.nama || '') + '</div>' +
    '<div class="jabatan">' + (staff.jabatan || '') + '</div>' +
    '<div class="id-staff">ID: ' + (staff.id || '').substring(0, 8).toUpperCase() + '</div>' +
    '<div class="cabang">' + (staff.id_cabang || '') + '</div>' +
    '</div>' +
    '<div class="strip"><span class="strip-text">KARTU IDENTITAS KARYAWAN · VALID 2024</span></div>' +
    '</div></body></html>';
}

function _buildReportHTML(type, idCabang, startDate, endDate, auth) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}' +
    'h2{color:#CC0000}table{width:100%;border-collapse:collapse}' +
    'th{background:#CC0000;color:white;padding:6px}td{padding:5px;border:1px solid #ddd}</style>' +
    '</head><body><h2>LAPORAN ' + type.toUpperCase() + '</h2>' +
    '<p>Cabang: ' + (idCabang || 'Semua') + ' | Periode: ' + startDate + ' s/d ' + endDate + '</p>' +
    '<p style="color:#888;font-style:italic">Data tersedia di dashboard sistem.</p>' +
    '</body></html>';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _htmlToPDF(html, filename) {
  var blob = Utilities.newBlob(html, 'text/html', filename.replace('.pdf', '.html'));
  return blob.getAs('application/pdf').setName(filename);
}

function _getPDFFolder() {
  var folderId = PropertiesService.getScriptProperties().getProperty('PDF_FOLDER_ID');
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch(e) {}
  }
  var folders = DriveApp.getFoldersByName('RIFIM_PAYROLL_PDF');
  if (folders.hasNext()) return folders.next();
  var folder = DriveApp.createFolder('RIFIM_PAYROLL_PDF');
  PropertiesService.getScriptProperties().setProperty('PDF_FOLDER_ID', folder.getId());
  return folder;
}

function _row(label, value) {
  return '<div class="row"><span class="label">' + label + '</span><span class="value">' + value + '</span></div>';
}

function _rowBold(label, value) {
  return '<div class="row" style="font-weight:bold"><span>' + label + '</span><span>' + value + '</span></div>';
}

function _rp(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function _formatPeriode(p) {
  var bulan = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  if (!p) return '';
  var parts = p.split('-');
  return bulan[parseInt(parts[1])] + ' ' + parts[0];
}
