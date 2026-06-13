/**
 * Staff.gs — CRUD staff management
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
  if (data.foto)      update.foto      = data.foto;
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function _sanitizeStaff(s) {
  var safe = {};
  Object.keys(s).forEach(function(k) { safe[k] = s[k]; });
  delete safe.password_hash;
  return safe;
}
