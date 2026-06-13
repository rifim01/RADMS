/**
 * Leave.gs — Cuti & izin management
 *
 * Sheet CUTI:
 *   id | id_staff | nama | id_cabang | jenis_cuti | tanggal_mulai | tanggal_selesai |
 *   jumlah_hari | keterangan | status | approved_by | alasan_tolak | created_at
 *
 * Kebijakan PT Rifim International Gemilang:
 *   TAHUNAN          — 3 hari per tahun, di luar High Season (Des/Jan)
 *   SAKIT            — max 2 hari tanpa potongan, lebih dianggap IZIN
 *   MENIKAH          — 7 hari (1 minggu), sekali seumur hidup
 *   HAMIL            — 90 hari (3 bulan), wajib cari pengganti, hanya dapat Bonus
 *   ISTRI_MELAHIRKAN — 3 hari untuk karyawan laki-laki
 *   IZIN             — koordinasi dengan tim lain, bisa kena potongan
 *
 *   Masa Training: 2 bulan pertama belum berhak THR/Bonus
 *   THR: minimal 1 tahun masa kerja
 *   Setiap cuti wajib mengkondisikan ke staff lain terlebih dahulu
 */

var CUTI_HEADERS = [
  'id','id_staff','nama','id_cabang','jenis_cuti','tanggal_mulai','tanggal_selesai',
  'jumlah_hari','keterangan','status','approved_by','alasan_tolak','created_at'
];

var KUOTA_CUTI = {
  TAHUNAN:          { maxKali: 1,  maxHari: 3 },
  SAKIT:            { maxKali: null, maxHari: 2 },
  MENIKAH:          { maxKali: 1,  maxHari: 7 },
  HAMIL:            { maxKali: 1,  maxHari: 90 },
  ISTRI_MELAHIRKAN: { maxKali: 1,  maxHari: 3 }
};

// Bulan High Season (1=Jan, 12=Des) — cuti TAHUNAN tidak boleh diambil
var HIGH_SEASON_MONTHS = [1, 12];

// ─── Ajukan Cuti ──────────────────────────────────────────────────────────────

function ajukanCuti(data, auth) {
  if (!data.id_staff || !data.jenis_cuti || !data.tanggal_mulai || !data.tanggal_selesai) {
    return { success: false, error: 'ID staff, jenis cuti, dan tanggal wajib diisi' };
  }

  var jenis = String(data.jenis_cuti).toUpperCase();
  var start = new Date(data.tanggal_mulai);
  var end   = new Date(data.tanggal_selesai);
  if (end < start) return { success: false, error: 'Tanggal selesai harus setelah tanggal mulai' };

  var hariKerja = _hitungHariKerja(start, end);
  var tahun     = start.getFullYear();
  var bulanMulai = start.getMonth() + 1;

  // Blokir cuti TAHUNAN saat High Season (Des & Jan)
  if (jenis === 'TAHUNAN' && HIGH_SEASON_MONTHS.indexOf(bulanMulai) !== -1) {
    return { success: false, error: 'Cuti Tahunan tidak dapat diambil saat High Season (Desember & Januari)' };
  }

  // Cek kuota
  var kuotaCheck = _cekKuota(data.id_staff, jenis, tahun, hariKerja);
  if (!kuotaCheck.ok) {
    return { success: false, error: 'Kuota Cuti Staff Sudah Habis: ' + kuotaCheck.message };
  }

  var row = {
    id:              generateId(),
    id_staff:        data.id_staff,
    nama:            data.nama || '',
    id_cabang:       data.id_cabang || auth.idCabang,
    jenis_cuti:      jenis,
    tanggal_mulai:   formatDate(start),
    tanggal_selesai: formatDate(end),
    jumlah_hari:     hariKerja,
    keterangan:      data.keterangan || '',
    status:          'PENDING',
    approved_by:     '',
    alasan_tolak:    '',
    created_at:      formatDateTime()
  };

  appendRow(PSHEET.CUTI, row, CUTI_HEADERS);
  return { success: true, data: row };
}

// ─── Approve / Reject ─────────────────────────────────────────────────────────

function approveCuti(id, auth) {
  var list = sheetToObjects(PSHEET.CUTI);
  var cuti = list.find(function(c) { return c.id === id; });
  if (!cuti) return { success: false, error: 'Permohonan tidak ditemukan' };
  if (!_canManageCabang(auth, cuti.id_cabang)) return { success: false, error: 'Akses ditolak' };
  if (cuti.status !== 'PENDING') return { success: false, error: 'Status bukan PENDING' };

  // Re-check kuota sebelum approve
  var jenis = String(cuti.jenis_cuti).toUpperCase();
  var tahun = new Date(cuti.tanggal_mulai).getFullYear();
  var kuota = _cekKuota(cuti.id_staff, jenis, tahun, Number(cuti.jumlah_hari), id);
  if (!kuota.ok) return { success: false, error: 'Kuota Cuti Staff Sudah Habis' };

  updateRow(PSHEET.CUTI, 'id', id, { status: 'APPROVED', approved_by: auth.userId });
  return { success: true, message: 'Cuti disetujui' };
}

function rejectCuti(id, alasan, auth) {
  var cuti = sheetToObjects(PSHEET.CUTI).find(function(c) { return c.id === id; });
  if (!cuti) return { success: false, error: 'Permohonan tidak ditemukan' };
  if (!_canManageCabang(auth, cuti.id_cabang)) return { success: false, error: 'Akses ditolak' };

  updateRow(PSHEET.CUTI, 'id', id, {
    status:       'REJECTED',
    approved_by:  auth.userId,
    alasan_tolak: alasan || ''
  });
  return { success: true, message: 'Cuti ditolak' };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

function getCutiList(idCabang, status, auth) {
  var list = sheetToObjects(PSHEET.CUTI);

  if (!_canManageCabang(auth, idCabang)) {
    list = list.filter(function(c) { return c.id_cabang === auth.idCabang; });
  } else if (idCabang) {
    list = list.filter(function(c) { return c.id_cabang === idCabang; });
  }

  if (status) list = list.filter(function(c) { return c.status === status; });

  list.sort(function(a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  return { success: true, data: list };
}

function getCutiKuota(idStaff, tahun, auth) {
  var year = tahun || new Date().getFullYear();
  var list = sheetToObjects(PSHEET.CUTI).filter(function(c) {
    return c.id_staff === idStaff
        && new Date(c.tanggal_mulai).getFullYear() == year
        && c.status === 'APPROVED';
  });

  var kuota = {};
  Object.keys(KUOTA_CUTI).forEach(function(jenis) {
    var taken  = list.filter(function(c) { return c.jenis_cuti === jenis; });
    var kali   = taken.length;
    var hari   = taken.reduce(function(s, c) { return s + (Number(c.jumlah_hari) || 0); }, 0);
    var config = KUOTA_CUTI[jenis];
    kuota[jenis] = {
      diambil_kali: kali,
      diambil_hari: hari,
      max_kali:     config.maxKali,
      max_hari:     config.maxHari,
      sisa_kali:    config.maxKali !== null ? Math.max(0, config.maxKali - kali) : null,
      sisa_hari:    config.maxHari !== null ? Math.max(0, config.maxHari - hari) : null
    };
  });

  return { success: true, tahun: year, kuota: kuota };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _hitungHariKerja(start, end) {
  var count = 0;
  var cur   = new Date(start);
  while (cur <= end) {
    var day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function _cekKuota(idStaff, jenis, tahun, hariDiajukan, excludeId) {
  var config = KUOTA_CUTI[jenis];
  if (!config) return { ok: true }; // IZIN tidak ada kuota

  var existing = sheetToObjects(PSHEET.CUTI).filter(function(c) {
    return c.id_staff === idStaff
        && c.jenis_cuti === jenis
        && c.status === 'APPROVED'
        && new Date(c.tanggal_mulai).getFullYear() == tahun
        && (!excludeId || c.id !== excludeId);
  });

  var totalKali = existing.length;
  var totalHari = existing.reduce(function(s, c) { return s + (Number(c.jumlah_hari) || 0); }, 0);

  if (config.maxKali !== null && totalKali >= config.maxKali) {
    return { ok: false, message: jenis + ' sudah ' + totalKali + '/' + config.maxKali + ' kali' };
  }
  if (config.maxHari !== null && (totalHari + hariDiajukan) > config.maxHari) {
    return { ok: false, message: jenis + ' sisa ' + (config.maxHari - totalHari) + ' hari' };
  }

  return { ok: true };
}
