/**
 * Attendance.gs — Absensi management
 *
 * Sheet ABSENSI columns:
 *   id | timestamp | tanggal | id_staff | nama | id_cabang | status | lat | lng | method
 *
 * status: Masuk | Pulang
 * method: manual | qr | gps
 */

var ABSENSI_HEADERS = ['id','timestamp','tanggal','id_staff','nama','id_cabang','status','lat','lng','method'];

// ─── Add ──────────────────────────────────────────────────────────────────────

function addAbsensi(data, auth) {
  if (!data.id_staff || !data.status) return { success: false, error: 'ID staff dan status wajib' };
  if (!['Masuk','Pulang'].includes(data.status)) return { success: false, error: 'Status harus Masuk atau Pulang' };

  var now = new Date();
  var today = formatDate(now);

  // Anti double input: cek apakah sudah ada entry status yang sama hari ini
  var existing = sheetToObjects(PSHEET.ABSENSI).filter(function(a) {
    return a.id_staff === data.id_staff
        && a.tanggal  === today
        && a.status   === data.status;
  });
  if (existing.length > 0) {
    return { success: false, error: 'Sudah absen ' + data.status + ' hari ini' };
  }

  var row = {
    id:        generateId(),
    timestamp: formatDateTime(now),
    tanggal:   today,
    id_staff:  data.id_staff,
    nama:      data.nama || '',
    id_cabang: data.id_cabang || auth.idCabang,
    status:    data.status,
    lat:       data.lat || '',
    lng:       data.lng || '',
    method:    data.method || 'manual'
  };

  appendRow(PSHEET.ABSENSI, row, ABSENSI_HEADERS);
  return { success: true, data: row };
}

// ─── Bulk Hadir ───────────────────────────────────────────────────────────────

function bulkHadir(idCabang, tanggal, auth) {
  if (!_canManageCabang(auth, idCabang)) return { success: false, error: 'Akses ditolak' };
  var date = tanggal || formatDate();

  var staffList = sheetToObjects(PSHEET.STAFF).filter(function(s) {
    return s.id_cabang === idCabang && s.status === 'AKTIF';
  });

  var existingToday = sheetToObjects(PSHEET.ABSENSI).filter(function(a) {
    return a.id_cabang === idCabang && a.tanggal === date && a.status === 'Masuk';
  });
  var existingIds = existingToday.map(function(a) { return a.id_staff; });

  var added = 0;
  staffList.forEach(function(s) {
    if (!existingIds.includes(s.id)) {
      appendRow(PSHEET.ABSENSI, {
        id:        generateId(),
        timestamp: formatDateTime(),
        tanggal:   date,
        id_staff:  s.id,
        nama:      s.nama,
        id_cabang: idCabang,
        status:    'Masuk',
        lat:       '',
        lng:       '',
        method:    'bulk'
      }, ABSENSI_HEADERS);
      added++;
    }
  });

  return { success: true, message: added + ' staff ditandai hadir', added: added };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

function getAbsensi(idCabang, startDate, endDate, auth) {
  var list = sheetToObjects(PSHEET.ABSENSI);

  if (!_canManageCabang(auth, idCabang)) {
    list = list.filter(function(a) { return a.id_cabang === auth.idCabang; });
  } else if (idCabang) {
    list = list.filter(function(a) { return a.id_cabang === idCabang; });
  }

  if (startDate) list = list.filter(function(a) { return a.tanggal >= startDate; });
  if (endDate)   list = list.filter(function(a) { return a.tanggal <= endDate; });

  // Sort by timestamp desc
  list.sort(function(a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });

  return { success: true, data: list, total: list.length };
}

function getSummaryAbsensi(idCabang, tanggal, auth) {
  var date = tanggal || formatDate();

  var cabangTarget = _canManageCabang(auth, idCabang) ? idCabang : auth.idCabang;

  var staffList = sheetToObjects(PSHEET.STAFF).filter(function(s) {
    var match = s.status === 'AKTIF';
    if (cabangTarget) match = match && s.id_cabang === cabangTarget;
    return match;
  });

  var absensi = sheetToObjects(PSHEET.ABSENSI).filter(function(a) {
    var match = a.tanggal === date;
    if (cabangTarget) match = match && a.id_cabang === cabangTarget;
    return match;
  });

  var masuk  = absensi.filter(function(a) { return a.status === 'Masuk'; }).map(function(a) { return a.id_staff; });
  var pulang = absensi.filter(function(a) { return a.status === 'Pulang'; }).map(function(a) { return a.id_staff; });

  var totalStaff = staffList.length;
  var hadir      = masuk.length;
  var alpha      = totalStaff - hadir;

  return {
    success:     true,
    tanggal:     date,
    totalStaff:  totalStaff,
    hadir:       hadir,
    pulang:      pulang.length,
    alpha:       alpha < 0 ? 0 : alpha,
    detail:      staffList.map(function(s) {
      return {
        id:       s.id,
        nama:     s.nama,
        jabatan:  s.jabatan,
        masuk:    masuk.includes(s.id),
        pulang:   pulang.includes(s.id),
        status:   masuk.includes(s.id) ? 'Hadir' : 'Alpha'
      };
    })
  };
}

// ─── Hitung hari kerja & alpha per periode ───────────────────────────────────

function hitungAbsensiPeriode(idStaff, periode) {
  var parts     = periode.split('-');
  var year      = parseInt(parts[0]);
  var month     = parseInt(parts[1]);
  var startDate = periode + '-01';
  var endDate   = periode + '-' + new Date(year, month, 0).getDate();

  var absensi = sheetToObjects(PSHEET.ABSENSI).filter(function(a) {
    return a.id_staff === idStaff
        && a.tanggal  >= startDate
        && a.tanggal  <= endDate
        && a.status   === 'Masuk';
  });

  var hariKerja = _hariKerjaBulan(year, month);
  var hariHadir = absensi.length;
  var hariAlpha = hariKerja - hariHadir;

  return {
    hariKerja: hariKerja,
    hariHadir: hariHadir,
    hariAlpha: hariAlpha < 0 ? 0 : hariAlpha
  };
}

function _hariKerjaBulan(year, month) {
  var count = 0;
  var days  = new Date(year, month, 0).getDate();
  for (var d = 1; d <= days; d++) {
    var day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++; // exclude Sunday & Saturday
  }
  return count;
}
