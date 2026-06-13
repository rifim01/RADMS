/**
 * Payroll.gs — Generate & kelola payroll bulanan
 *
 * Sheet PAYROLL (run header):
 *   id | periode | id_cabang | total_staff | total_gaji_kotor | total_potongan |
 *   total_gaji_bersih | status | generated_by | generated_at | pdf_url
 *
 * Sheet PAYROLL_DETAIL (per staff):
 *   id | payroll_id | periode | id_staff | nama | jabatan | id_cabang |
 *   gapok | bpjs | data_pulsa | bonus_target | total_lembur |
 *   kasbon | potongan_alpha | denda_telat | gaji_kotor | total_potongan |
 *   gaji_bersih | status | slip_pdf_url
 *
 * Rumus:
 *   Gaji Kotor  = gapok + bpjs(55k) + data(100k) + bonus + lembur
 *   Potongan    = kasbon + alpha(gapok/26 * hariAlpha) + denda_telat
 *   Gaji Bersih = Gaji Kotor - Potongan
 */

var PAYROLL_HEADERS = [
  'id','periode','id_cabang','total_staff','total_gaji_kotor','total_potongan',
  'total_gaji_bersih','status','generated_by','generated_at','pdf_url'
];

var DETAIL_HEADERS = [
  'id','payroll_id','periode','id_staff','nama','jabatan','id_cabang',
  'gapok','bpjs','data_pulsa','bonus_target','total_lembur',
  'kasbon','potongan_alpha','denda_telat','gaji_kotor','total_potongan',
  'gaji_bersih','status','slip_pdf_url'
];

var BPJS_NOMINAL  = 55000;
var DATA_NOMINAL  = 100000;

// ─── Generate Payroll ────────────────────────────────────────────────────────

function generatePayroll(periode, idCabang, auth) {
  if (!periode || !idCabang) return { success: false, error: 'Periode dan cabang wajib diisi' };
  if (!_canManageCabang(auth, idCabang)) return { success: false, error: 'Akses ditolak' };

  // Anti double generate
  var existing = sheetToObjects(PSHEET.PAYROLL).find(function(p) {
    return p.periode === periode && p.id_cabang === idCabang;
  });
  if (existing) return { success: false, error: 'Payroll ' + periode + ' sudah pernah digenerate' };

  var staffList = sheetToObjects(PSHEET.STAFF).filter(function(s) {
    return s.id_cabang === idCabang && s.status === 'AKTIF';
  });
  if (staffList.length === 0) return { success: false, error: 'Tidak ada staff aktif di cabang ini' };

  var payrollId = generateId();
  var details   = [];

  staffList.forEach(function(staff) {
    var detail = _hitungPayrollStaff(payrollId, periode, staff, idCabang);
    appendRow(PSHEET.PAYROLL_DETAIL, detail, DETAIL_HEADERS);
    details.push(detail);
  });

  // Hitung total
  var totalKotor  = details.reduce(function(s, d) { return s + d.gaji_kotor; }, 0);
  var totalPotong = details.reduce(function(s, d) { return s + d.total_potongan; }, 0);
  var totalBersih = details.reduce(function(s, d) { return s + d.gaji_bersih; }, 0);

  var run = {
    id:               payrollId,
    periode:          periode,
    id_cabang:        idCabang,
    total_staff:      staffList.length,
    total_gaji_kotor: totalKotor,
    total_potongan:   totalPotong,
    total_gaji_bersih: totalBersih,
    status:           'DRAFT',
    generated_by:     auth.userId,
    generated_at:     formatDateTime(),
    pdf_url:          ''
  };

  appendRow(PSHEET.PAYROLL, run, PAYROLL_HEADERS);

  return { success: true, data: run, details: details };
}

// ─── Kalkulasi per staff ──────────────────────────────────────────────────────

function _hitungPayrollStaff(payrollId, periode, staff, idCabang) {
  var gapok = Number(staff.gapok) || 0;

  // Ambil lembur yang sudah approved di periode ini
  var lemburList = sheetToObjects(PSHEET.LEMBUR).filter(function(l) {
    return l.id_staff  === staff.id
        && l.periode   === periode
        && l.status    === 'APPROVED';
  });
  var totalLembur = lemburList.reduce(function(s, l) { return s + (Number(l.total_lembur) || 0); }, 0);

  // Ambil kasbon yang jatuh tempo periode ini
  var kasbonList = sheetToObjects(PSHEET.KASBON).filter(function(k) {
    return k.id_staff       === staff.id
        && k.periode_potong === periode
        && k.status         !== 'LUNAS';
  });
  var totalKasbon = kasbonList.reduce(function(s, k) { return s + (Number(k.jumlah) || 0); }, 0);

  // Anti kasbon > gaji
  if (totalKasbon > gapok) totalKasbon = gapok;

  // Hitung hari alpha
  var absensi      = hitungAbsensiPeriode(staff.id, periode);
  var potonganAlpha = (gapok / 26) * absensi.hariAlpha;

  var gajiKotor   = gapok + BPJS_NOMINAL + DATA_NOMINAL + totalLembur;
  var totalPotong = totalKasbon + potonganAlpha;
  var gajiBersih  = gajiKotor - totalPotong;

  return {
    id:              generateId(),
    payroll_id:      payrollId,
    periode:         periode,
    id_staff:        staff.id,
    nama:            staff.nama,
    jabatan:         staff.jabatan || '',
    id_cabang:       idCabang,
    gapok:           gapok,
    bpjs:            BPJS_NOMINAL,
    data_pulsa:      DATA_NOMINAL,
    bonus_target:    0,
    total_lembur:    totalLembur,
    kasbon:          totalKasbon,
    potongan_alpha:  Math.round(potonganAlpha),
    denda_telat:     0,
    gaji_kotor:      Math.round(gajiKotor),
    total_potongan:  Math.round(totalPotong),
    gaji_bersih:     Math.round(gajiBersih),
    status:          'DRAFT',
    slip_pdf_url:    ''
  };
}

// ─── Update detail (edit bonus/kasbon manual) ─────────────────────────────────

function updatePayrollDetail(id, data, auth) {
  var details = sheetToObjects(PSHEET.PAYROLL_DETAIL);
  var detail  = details.find(function(d) { return d.id === id; });
  if (!detail) return { success: false, error: 'Detail tidak ditemukan' };

  var update = {};
  if (data.bonus_target !== undefined) update.bonus_target = Number(data.bonus_target);
  if (data.kasbon       !== undefined) update.kasbon       = Number(data.kasbon);
  if (data.denda_telat  !== undefined) update.denda_telat  = Number(data.denda_telat);

  // Recalculate
  var gapok      = Number(detail.gapok);
  var lembur     = Number(detail.total_lembur);
  var bonus      = update.bonus_target  !== undefined ? update.bonus_target  : Number(detail.bonus_target);
  var kasbon     = update.kasbon        !== undefined ? update.kasbon        : Number(detail.kasbon);
  var denda      = update.denda_telat   !== undefined ? update.denda_telat   : Number(detail.denda_telat);
  var potonganAl = Number(detail.potongan_alpha);

  var gajiKotor  = gapok + BPJS_NOMINAL + DATA_NOMINAL + bonus + lembur;
  var totalPotong = kasbon + potonganAl + denda;
  var gajiBersih  = gajiKotor - totalPotong;

  update.gaji_kotor      = Math.round(gajiKotor);
  update.total_potongan  = Math.round(totalPotong);
  update.gaji_bersih     = Math.round(gajiBersih);

  updateRow(PSHEET.PAYROLL_DETAIL, 'id', id, update);
  return { success: true, data: Object.assign({}, detail, update) };
}

// ─── Finalize Payroll ─────────────────────────────────────────────────────────

function finalizePayroll(payrollId, auth) {
  var runs = sheetToObjects(PSHEET.PAYROLL);
  var run  = runs.find(function(p) { return p.id === payrollId; });
  if (!run) return { success: false, error: 'Payroll tidak ditemukan' };
  if (!_canManageCabang(auth, run.id_cabang)) return { success: false, error: 'Akses ditolak' };
  if (run.status === 'FINAL') return { success: false, error: 'Payroll sudah final' };

  updateRow(PSHEET.PAYROLL, 'id', payrollId, { status: 'FINAL' });
  updateRow(PSHEET.PAYROLL_DETAIL, 'payroll_id', payrollId, { status: 'FINAL' });

  return { success: true, message: 'Payroll berhasil difinalkan' };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

function getPayrollRuns(idCabang, tahun, auth) {
  var list = sheetToObjects(PSHEET.PAYROLL);

  if (!_canManageCabang(auth, idCabang)) {
    list = list.filter(function(p) { return p.id_cabang === auth.idCabang; });
  } else if (idCabang) {
    list = list.filter(function(p) { return p.id_cabang === idCabang; });
  }

  if (tahun) list = list.filter(function(p) { return String(p.periode).startsWith(tahun); });

  list.sort(function(a, b) { return String(b.periode).localeCompare(String(a.periode)); });

  return { success: true, data: list };
}

function getPayrollDetail(payrollId, auth) {
  var details = sheetToObjects(PSHEET.PAYROLL_DETAIL).filter(function(d) {
    return d.payroll_id === payrollId;
  });
  return { success: true, data: details };
}

function getPayrollSlip(idStaff, periode, auth) {
  var detail = sheetToObjects(PSHEET.PAYROLL_DETAIL).find(function(d) {
    return d.id_staff === idStaff && d.periode === periode;
  });
  if (!detail) return { success: false, error: 'Slip tidak ditemukan' };
  return { success: true, data: detail };
}

// ─── Lembur ───────────────────────────────────────────────────────────────────
// (Sheet LEMBUR: id|id_staff|nama|id_cabang|tanggal|jam_masuk|jam_keluar|
//  jam_normal|jam_lembur|gapok|tarif_lembur|total_lembur|keterangan|
//  approved_by|status|created_at|periode)

var LEMBUR_HEADERS = [
  'id','id_staff','nama','id_cabang','tanggal','jam_masuk','jam_keluar',
  'jam_normal','jam_lembur','gapok','tarif_lembur','total_lembur','keterangan',
  'approved_by','status','created_at','periode'
];

function addLembur(data, auth) {
  if (!data.id_staff || !data.tanggal) return { success: false, error: 'ID staff dan tanggal wajib' };

  // Validasi jam lembur max 12 jam total
  var jamMasuk  = _timeToMinutes(data.jam_masuk  || '08:00');
  var jamKeluar = _timeToMinutes(data.jam_keluar || '17:00');
  var jamNormal = 9 * 60;
  var jamLembur = Math.max(0, (jamKeluar - jamMasuk) - jamNormal);

  if (jamLembur > 12 * 60) return { success: false, error: 'Jam lembur tidak boleh lebih dari 12 jam' };
  if (jamLembur <= 0)       return { success: false, error: 'Tidak ada jam lembur' };

  var gapok        = Number(data.gapok) || 0;
  var tarifLembur  = gapok / 173; // standar Depnaker: gapok / 173 per jam
  var totalLembur  = (jamLembur / 60) * tarifLembur;

  // Ambil periode dari tanggal
  var tgl     = new Date(data.tanggal);
  var periode = Utilities.formatDate(tgl, 'Asia/Jakarta', 'yyyy-MM');

  var row = {
    id:           generateId(),
    id_staff:     data.id_staff,
    nama:         data.nama || '',
    id_cabang:    data.id_cabang || auth.idCabang,
    tanggal:      data.tanggal,
    jam_masuk:    data.jam_masuk || '08:00',
    jam_keluar:   data.jam_keluar,
    jam_normal:   '09:00',
    jam_lembur:   (jamLembur / 60).toFixed(2),
    gapok:        gapok,
    tarif_lembur: Math.round(tarifLembur),
    total_lembur: Math.round(totalLembur),
    keterangan:   data.keterangan || '',
    approved_by:  '',
    status:       'PENDING',
    created_at:   formatDateTime(),
    periode:      periode
  };

  appendRow(PSHEET.LEMBUR, row, LEMBUR_HEADERS);
  return { success: true, data: row };
}

function approveLembur(id, auth) {
  updateRow(PSHEET.LEMBUR, 'id', id, { status: 'APPROVED', approved_by: auth.userId });
  return { success: true, message: 'Lembur disetujui' };
}

function rejectLembur(id, auth) {
  updateRow(PSHEET.LEMBUR, 'id', id, { status: 'REJECTED', approved_by: auth.userId });
  return { success: true, message: 'Lembur ditolak' };
}

function getLembur(idCabang, periode, auth) {
  var list = sheetToObjects(PSHEET.LEMBUR);
  if (!_canManageCabang(auth, idCabang)) {
    list = list.filter(function(l) { return l.id_cabang === auth.idCabang; });
  } else if (idCabang) {
    list = list.filter(function(l) { return l.id_cabang === idCabang; });
  }
  if (periode) list = list.filter(function(l) { return l.periode === periode; });
  return { success: true, data: list };
}

// ─── Kasbon ───────────────────────────────────────────────────────────────────
// (Sheet KASBON: id|id_staff|nama|id_cabang|tanggal|jumlah|keterangan|periode_potong|status|created_at)

var KASBON_HEADERS = ['id','id_staff','nama','id_cabang','tanggal','jumlah','keterangan','periode_potong','status','created_at'];

function addKasbon(data, auth) {
  if (!data.id_staff || !data.jumlah) return { success: false, error: 'ID staff dan jumlah wajib' };

  var staff = sheetToObjects(PSHEET.STAFF).find(function(s) { return s.id === data.id_staff; });
  if (!staff) return { success: false, error: 'Staff tidak ditemukan' };

  // Anti kasbon > gaji
  if (Number(data.jumlah) > Number(staff.gapok)) {
    return { success: false, error: 'Kasbon tidak boleh melebihi gaji pokok (' + _formatRp(staff.gapok) + ')' };
  }

  var row = {
    id:             generateId(),
    id_staff:       data.id_staff,
    nama:           staff.nama,
    id_cabang:      data.id_cabang || auth.idCabang,
    tanggal:        formatDate(),
    jumlah:         Number(data.jumlah),
    keterangan:     data.keterangan || '',
    periode_potong: data.periode_potong || '',
    status:         'AKTIF',
    created_at:     formatDateTime()
  };

  appendRow(PSHEET.KASBON, row, KASBON_HEADERS);
  return { success: true, data: row };
}

function getKasbon(idStaff, auth) {
  var list = sheetToObjects(PSHEET.KASBON).filter(function(k) { return k.id_staff === idStaff; });
  return { success: true, data: list };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _timeToMinutes(t) {
  if (!t) return 0;
  var parts = String(t).split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
}

function _formatRp(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}
