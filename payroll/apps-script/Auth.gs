/**
 * Auth.gs — Login, token generate & verify
 *
 * Roles: OWNER | SUPER_ADMIN | ADMIN_CABANG | STAFF
 *
 * STAFF sheet columns:
 *   id | nama | email | password_hash | role | id_cabang | status
 */

var PR_TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET') || 'rifim-payroll-secret-2024';
var PR_TOKEN_TTL    = 8; // hours

// ─── Login ────────────────────────────────────────────────────────────────────

function prLogin(email, password) {
  if (!email || !password) return { success: false, error: 'Email dan password wajib diisi' };

  try {
    var staffList = sheetToObjects(PSHEET.STAFF);
    var user = staffList.find(function(s) {
      return String(s.email).trim().toLowerCase() === String(email).trim().toLowerCase()
          && s.status === 'AKTIF';
    });

    if (!user) return { success: false, error: 'Akun tidak ditemukan' };

    var hashed = _prHashPw(password);
    if (user.password_hash !== hashed) return { success: false, error: 'Password salah' };

    var token = _prGenerateToken(user.id, user.role, user.id_cabang);

    return {
      success: true,
      token: token,
      user: {
        id:        user.id,
        nama:      user.nama,
        email:     user.email,
        role:      user.role,
        idCabang:  user.id_cabang,
        jabatan:   user.jabatan || ''
      }
    };
  } catch (err) {
    Logger.log('prLogin error: ' + err.message);
    return { success: false, error: 'Login gagal: ' + err.message };
  }
}

// ─── Verify ───────────────────────────────────────────────────────────────────

function prVerifyToken(token) {
  if (!token) return { valid: false, reason: 'Token tidak ada' };
  try {
    var parts = token.split('.');
    if (parts.length !== 2) return { valid: false, reason: 'Token tidak valid' };

    var payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString());

    if (!payload.exp || Date.now() > payload.exp) return { valid: false, reason: 'Token expired' };

    var sig = _prSign(parts[0]);
    if (sig !== parts[1]) return { valid: false, reason: 'Signature tidak valid' };

    return { valid: true, userId: payload.uid, role: payload.role, idCabang: payload.cab };
  } catch (err) {
    return { valid: false, reason: 'Verifikasi gagal: ' + err.message };
  }
}

// ─── Private ──────────────────────────────────────────────────────────────────

function _prGenerateToken(uid, role, cab) {
  var payload = {
    uid:  uid,
    role: role,
    cab:  cab,
    iat:  Date.now(),
    exp:  Date.now() + PR_TOKEN_TTL * 3600 * 1000
  };
  var b64  = Utilities.base64Encode(JSON.stringify(payload));
  var sig  = _prSign(b64);
  return b64 + '.' + sig;
}

function _prSign(data) {
  var key  = Utilities.newBlob(PR_TOKEN_SECRET).getBytes();
  var raw  = Utilities.newBlob(data).getBytes();
  return Utilities.base64Encode(Utilities.computeHmacSha256Signature(raw, key));
}

function _prHashPw(pw) {
  var raw = Utilities.newBlob(pw + PR_TOKEN_SECRET).getBytes();
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw));
}

// ─── Setup: buat akun pertama (jalankan sekali dari Apps Script Editor) ───────

function setupOwnerAccount() {
  var email    = 'owner@rifimgemilang.com';
  var password = 'Rifim@2024!';
  var hashed   = _prHashPw(password);

  var headers = ['id','nama','email','password_hash','role','id_cabang','jabatan',
                 'gapok','nomor_hp','foto','status','created_at'];
  appendRow(PSHEET.STAFF, {
    id:            generateId(),
    nama:          'Owner RIFIM',
    email:         email,
    password_hash: hashed,
    role:          'OWNER',
    id_cabang:     'ALL',
    jabatan:       'Owner',
    gapok:         0,
    nomor_hp:      '',
    foto:          '',
    status:        'AKTIF',
    created_at:    formatDateTime()
  }, headers);

  Logger.log('Owner dibuat: ' + email + ' / ' + password);
}
