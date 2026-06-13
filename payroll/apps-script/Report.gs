/**
 * Report.gs — Dashboard & laporan agregat
 */

// ─── Dashboard ────────────────────────────────────────────────────────────────

function getDashboard(idCabang, tanggal, auth) {
  var today = tanggal || formatDate();
  var cabang = _canManageCabang(auth, idCabang) ? idCabang : auth.idCabang;

  var allStaff = sheetToObjects(PSHEET.STAFF).filter(function(s) { return s.status === 'AKTIF'; });
  if (cabang) allStaff = allStaff.filter(function(s) { return s.id_cabang === cabang; });

  var absensiHariIni = sheetToObjects(PSHEET.ABSENSI).filter(function(a) {
    var match = a.tanggal === today;
    if (cabang) match = match && a.id_cabang === cabang;
    return match;
  });

  var hadir  = absensiHariIni.filter(function(a) { return a.status === 'Masuk'; });
  var hadirIds = hadir.map(function(a) { return a.id_staff; });

  var bulanIni = today.substring(0, 7);
  var payrollBulanIni = sheetToObjects(PSHEET.PAYROLL_DETAIL).filter(function(d) {
    var match = d.periode === bulanIni;
    if (cabang) match = match && d.id_cabang === cabang;
    return match;
  });
  var totalPayroll = payrollBulanIni.reduce(function(s, d) { return s + (Number(d.gaji_bersih) || 0); }, 0);

  var cutiHariIni = sheetToObjects(PSHEET.CUTI).filter(function(c) {
    return c.status === 'APPROVED'
        && c.tanggal_mulai <= today
        && c.tanggal_selesai >= today
        && (!cabang || c.id_cabang === cabang);
  });

  // Grafik kehadiran 7 hari terakhir
  var grafikKehadiran = _grafikKehadiran7Hari(cabang, today);

  // Grafik payroll 6 bulan
  var grafikPayroll = _grafikPayroll6Bulan(cabang, today);

  return {
    success: true,
    tanggal: today,
    widgets: {
      totalStaff:      allStaff.length,
      hadirHariIni:    hadirIds.length,
      alphaHariIni:    Math.max(0, allStaff.length - hadirIds.length),
      cutiHariIni:     cutiHariIni.length,
      totalPayrollBulanIni: totalPayroll
    },
    grafikKehadiran: grafikKehadiran,
    grafikPayroll:   grafikPayroll,
    cabangList:      _summaryCabang(today)
  };
}

// ─── Report ───────────────────────────────────────────────────────────────────

function getReport(type, idCabang, startDate, endDate, auth) {
  var cabang = _canManageCabang(auth, idCabang) ? idCabang : auth.idCabang;

  switch (type) {
    case 'payroll':    return _reportPayroll(cabang, startDate, endDate);
    case 'attendance': return _reportAttendance(cabang, startDate, endDate);
    case 'staff':      return _reportStaff(cabang);
    case 'cuti':       return _reportCuti(cabang, startDate, endDate);
    default:           return { success: false, error: 'Tipe laporan tidak dikenal: ' + type };
  }
}

function _reportPayroll(cabang, startDate, endDate) {
  var list = sheetToObjects(PSHEET.PAYROLL_DETAIL);
  if (cabang)   list = list.filter(function(d) { return d.id_cabang === cabang; });
  if (startDate) list = list.filter(function(d) { return d.periode >= startDate.substring(0, 7); });
  if (endDate)   list = list.filter(function(d) { return d.periode <= endDate.substring(0, 7); });

  var total = list.reduce(function(s, d) { return s + (Number(d.gaji_bersih) || 0); }, 0);
  return { success: true, type: 'payroll', data: list, total: total };
}

function _reportAttendance(cabang, startDate, endDate) {
  var list = sheetToObjects(PSHEET.ABSENSI);
  if (cabang)    list = list.filter(function(a) { return a.id_cabang === cabang; });
  if (startDate) list = list.filter(function(a) { return a.tanggal >= startDate; });
  if (endDate)   list = list.filter(function(a) { return a.tanggal <= endDate; });
  return { success: true, type: 'attendance', data: list, total: list.length };
}

function _reportStaff(cabang) {
  var list = sheetToObjects(PSHEET.STAFF).filter(function(s) { return s.status !== 'DELETED'; });
  if (cabang) list = list.filter(function(s) { return s.id_cabang === cabang; });
  return { success: true, type: 'staff', data: list.map(_sanitizeStaff), total: list.length };
}

function _reportCuti(cabang, startDate, endDate) {
  var list = sheetToObjects(PSHEET.CUTI);
  if (cabang)    list = list.filter(function(c) { return c.id_cabang === cabang; });
  if (startDate) list = list.filter(function(c) { return c.tanggal_mulai >= startDate; });
  if (endDate)   list = list.filter(function(c) { return c.tanggal_selesai <= endDate; });
  return { success: true, type: 'cuti', data: list, total: list.length };
}

// ─── Grafik Helpers ───────────────────────────────────────────────────────────

function _grafikKehadiran7Hari(cabang, today) {
  var result = [];
  var allAbsensi = sheetToObjects(PSHEET.ABSENSI);
  var allStaff   = sheetToObjects(PSHEET.STAFF).filter(function(s) {
    return s.status === 'AKTIF' && (!cabang || s.id_cabang === cabang);
  });

  for (var i = 6; i >= 0; i--) {
    var d    = new Date(today);
    d.setDate(d.getDate() - i);
    var tgl  = formatDate(d);
    var hadir = allAbsensi.filter(function(a) {
      return a.tanggal === tgl && a.status === 'Masuk' && (!cabang || a.id_cabang === cabang);
    }).length;
    result.push({ tanggal: tgl, hadir: hadir, total: allStaff.length });
  }
  return result;
}

function _grafikPayroll6Bulan(cabang, today) {
  var result = [];
  var allDetail = sheetToObjects(PSHEET.PAYROLL_DETAIL);
  var base  = new Date(today.substring(0, 7) + '-01');

  for (var i = 5; i >= 0; i--) {
    var d      = new Date(base);
    d.setMonth(d.getMonth() - i);
    var periode = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM');
    var total   = allDetail.filter(function(pd) {
      return pd.periode === periode && (!cabang || pd.id_cabang === cabang);
    }).reduce(function(s, pd) { return s + (Number(pd.gaji_bersih) || 0); }, 0);
    result.push({ periode: periode, total: total });
  }
  return result;
}

function _summaryCabang(today) {
  var allStaff   = sheetToObjects(PSHEET.STAFF).filter(function(s) { return s.status === 'AKTIF'; });
  var allAbsensi = sheetToObjects(PSHEET.ABSENSI).filter(function(a) { return a.tanggal === today && a.status === 'Masuk'; });

  return MASTER_CABANG.map(function(cab) {
    var staffCab = allStaff.filter(function(s) { return s.id_cabang === cab.id; }).length;
    var hadirCab = allAbsensi.filter(function(a) { return a.id_cabang === cab.id; }).length;
    return { id: cab.id, nama: cab.nama, totalStaff: staffCab, hadir: hadirCab };
  });
}
