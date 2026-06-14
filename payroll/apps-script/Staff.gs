/**
 * Staff.gs — CRUD staff management + sync dari MASTER DATA STAFF
 *
 * Sheet STAFF columns:
 *   id | nama | email | password_hash | role | id_cabang | jabatan |
 *   gapok | nomor_hp | foto | status | created_at
 */

var STAFF_HEADERS = [
  'id','nama','email','password_hash','role','id_cabang','jabatan',
  'gapok','nomor_hp','foto','status','created_at'
];

// ─── Read ─────────────────────────────────────────────────────────────────────

function getStaffList(idCabang, auth) {
  var list = sheetToObjects(PSHEET.STAFF).filter(function(s) { return s.status !== 'DELETED'; });

  if (auth.role !== 'OWNER' && auth.role !== 'SUPER_ADMIN') {
    list = list.filter(function(s) { return s.id_cabang === auth.idCabang; });
  } else if (idCabang) {
    list = list.filter(function(s) { return s.id_cabang === idCabang; });
  }

  return {
    success: true,
    data: list.map(_sanitizeStaff),
    total: list.length
  };
}

function getStaffById(id, auth) {
  var list   = sheetToObjects(PSHEET.STAFF);
  var staff  = list.find(function(s) { return s.id === id && s.status !== 'DELETED'; });
  if (!staff) return { success: false, error: 'Staff tidak ditemukan' };
  if (!_canManageCabang(auth, staff.id_cabang)) return { success: false, error: 'Akses ditolak' };
  return { success: true, data: _sanitizeStaff(staff) };
}

// ─── Create ───────────────────────────────────────────────────────────────────

function addStaff(data, auth) {
  if (!data.nama || !data.email || !data.id_cabang) {
    return { success: false, error: 'Nama, email, dan cabang wajib diisi' };
  }
  if (!_canManageCabang(auth, data.id_cabang)) return { success: false, error: 'Akses ditolak' };

  var existing = sheetToObjects(PSHEET.STAFF);
  var dup = existing.find(function(s) {
    return String(s.email).toLowerCase() === String(data.email).toLowerCase() && s.status !== 'DELETED';
  });
  if (dup) return { success: false, error: 'Email sudah terdaftar' };

  var defaultPw = 'Rifim' + Math.floor(1000 + Math.random() * 9000);
  var staff = {
    id:            generateId(),
    nama:          data.nama,
    email:         data.email,
    password_hash: _prHashPw(data.password || defaultPw),
    role:          data.role || 'STAFF',
    id_cabang:     data.id_cabang,
    jabatan:       data.jabatan || '',
    gapok:         Number(data.gapok) || 0,
    nomor_hp:      data.nomor_hp || '',
    foto:          data.foto || '',
    status:        'AKTIF',
    created_at:    formatDateTime()
  };

  appendRow(PSHEET.STAFF, staff, STAFF_HEADERS);

  return { success: true, data: _sanitizeStaff(staff), tempPassword: data.password ? null : defaultPw };
}

// ─── Update ───────────────────────────────────────────────────────────────────

function updateStaff(id, data, auth) {
  var list  = sheetToObjects(PSHEET.STAFF);
  var staff = list.find(function(s) { return s.id === id; });
  if (!staff) return { success: false, error: 'Staff tidak ditemukan' };
  if (!_canManageCabang(auth, staff.id_cabang)) return { success: false, error: 'Akses ditolak' };

  var update = {};
  if (data.nama)      update.nama      = data.nama;
  if (data.jabatan !== undefined) update.jabatan = data.jabatan;
  if (data.gapok !== undefined)   update.gapok   = Number(data.gapok);
  if (data.nomor_hp)  update.nomor_hp  = data.nomor_hp;
  if (data.foto !== undefined)     update.foto     = data.foto;
  if (data.bg_url !== undefined)   update.bg_url   = data.bg_url;
  if (data.logo_url !== undefined) update.logo_url = data.logo_url;
  if (data.status)    update.status    = data.status;
  if (data.id_cabang && _canManageCabang(auth, data.id_cabang)) update.id_cabang = data.id_cabang;
  if (data.password)  update.password_hash = _prHashPw(data.password);

  updateRow(PSHEET.STAFF, 'id', id, update);
  return { success: true, message: 'Staff berhasil diupdate' };
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

function deleteStaff(id, auth) {
  var list  = sheetToObjects(PSHEET.STAFF);
  var staff = list.find(function(s) { return s.id === id; });
  if (!staff) return { success: false, error: 'Staff tidak ditemukan' };
  if (!_canManageCabang(auth, staff.id_cabang)) return { success: false, error: 'Akses ditolak' };

  updateRow(PSHEET.STAFF, 'id', id, { status: 'DELETED' });
  return { success: true, message: 'Staff berhasil dihapus' };
}

// ─── Sync dari MASTER DATA STAFF Sheet ───────────────────────────────────────
// Sheet: https://docs.google.com/spreadsheets/d/1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw
// Tab: MASTER DATA STAFF | Kolom: email[0] nama[1] gapok[2] id_cabang[3] id[4] jabatan[5]

function syncStaffFromMaster(auth) {
  if (!auth || (auth.role !== 'OWNER' && auth.role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Akses ditolak' };
  }

  var MASTER_SPREADSHEET_ID = '1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw';
  var MASTER_SHEET_NAME     = 'MASTER DATA STAFF';
  var DEFAULT_PW            = 'Rifim1234';

  var ss    = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(MASTER_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: 'Sheet "' + MASTER_SHEET_NAME + '" tidak ditemukan' };
  }

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return { success: true, added: 0, updated: 0, total: 0, message: 'Tidak ada data staff di sheet master' };
  }

  var payrollStaff = sheetToObjects(PSHEET.STAFF);
  var added = 0, updated = 0;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function(c) { return !c; })) continue;

    var email    = String(row[0] || '').trim();
    var nama     = String(row[1] || '').trim();
    var gapok    = Number(row[2] || 0);
    var idCabang = String(row[3] || '').trim();
    var idStaff  = String(row[4] || '').trim();
    var jabatan  = String(row[5] || '').trim();

    if (!idStaff || !nama) continue;

    var existing = payrollStaff.find(function(s) { return String(s.id) === idStaff; });

    if (!existing) {
      appendRow(
        PSHEET.STAFF,
        {
          id:            idStaff,
          nama:          nama,
          email:         email,
          password_hash: _prHashPw(DEFAULT_PW),
          role:          'STAFF',
          id_cabang:     idCabang,
          jabatan:       jabatan,
          gapok:         gapok,
          nomor_hp:      '',
          foto:          '',
          status:        'AKTIF',
          created_at:    formatDateTime()
        },
        STAFF_HEADERS
      );
      added++;
    } else {
      updateRow(
        PSHEET.STAFF,
        'id',
        idStaff,
        {
          nama:      nama,
          email:     email,
          id_cabang: idCabang,
          jabatan:   jabatan,
          gapok:     gapok,
          status:    'AKTIF'
        }
      );
      updated++;
    }
  }

  return {
    success: true,
    added:   added,
    updated: updated,
    total:   added + updated,
    message: added + ' staff baru ditambahkan, ' + updated + ' diperbarui. Password default: ' + DEFAULT_PW
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function _sanitizeStaff(s) {
  var safe = {};
  Object.keys(s).forEach(function(k) { safe[k] = s[k]; });
  delete safe.password_hash;
  return safe;
}
