/**
 * config.js — Konfigurasi global aplikasi
 * Ganti GAS_URL dengan URL deployment Google Apps Script kamu
 */

window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbze5uExLZ8mukFg0uC5xQ_Z71EeSrKTNa9h8aq0fxib57HfmY09UPaz1sWfFYs4ees/exec',
  APP_NAME: 'RIFIM Payroll',
  VERSION: '1.0.0',

  CABANG: [
    { id: 'BTM-APT', nama: 'ID Rifim Airport Batam',        kota: 'BATAM',       bandara: 'HANG NADIM INTERNATIONAL AIRPORT' },
    { id: 'JMB-APT', nama: 'ID Rifim Airport Jambi',        kota: 'JAMBI',       bandara: 'SULTAN THAHA SAIFUDDIN AIRPORT' },
    { id: 'BPN-APT', nama: 'ID Rifim Airport Balikpapan',   kota: 'BALIKPAPAN',  bandara: 'SULTAN AJI MUHAMMAD SULAIMAN AIRPORT' },
    { id: 'MDO-APT', nama: 'ID Rifim Airport Manado',       kota: 'MANADO',      bandara: 'SAM RATULANGI INTERNATIONAL AIRPORT' },
    { id: 'PKU-APT', nama: 'ID Rifim Airport Pekanbaru',    kota: 'PEKANBARU',   bandara: 'SULTAN SYARIF KASIM II AIRPORT' },
    { id: 'MKS-APT', nama: 'ID Rifim Airport Makassar',     kota: 'MAKASSAR',    bandara: 'SULTAN HASANUDDIN INTERNATIONAL AIRPORT' },
    { id: 'BTM-OFF', nama: 'ID Rifim Batam',                kota: 'BATAM',       bandara: 'KANTOR' },
    { id: 'JMB-OFF', nama: 'ID Rifim Jambi Luar',           kota: 'JAMBI',       bandara: 'KANTOR' }
  ],

  ROLES: {
    OWNER:         'Owner',
    SUPER_ADMIN:   'Super Admin',
    ADMIN_CABANG:  'Admin Cabang',
    STAFF:         'Staff'
  },

  // HR Rules — sesuai kebijakan PT Rifim International Gemilang
  HR_RULES: {
    MASA_TRAINING_BULAN:   2,     // probation, belum dapat THR/Bonus
    THR_MIN_KERJA_BULAN:   12,    // minimal 1 tahun untuk dapat THR
    MASA_HIGH_SEASON:      ['12', '01'],  // Des & Jan = high season, cuti dibatasi
  },

  JENIS_CUTI: ['TAHUNAN', 'SAKIT', 'MENIKAH', 'HAMIL', 'ISTRI_MELAHIRKAN', 'IZIN'],

  KUOTA_CUTI: {
    TAHUNAN:          { maxHari: 3,   label: 'Cuti Tahunan (3 hari, di luar High Season)' },
    SAKIT:            { maxHari: 2,   label: 'Cuti Sakit (max 2 hari tanpa potongan)' },
    MENIKAH:          { maxHari: 7,   label: 'Cuti Menikah (1 minggu)' },
    HAMIL:            { maxHari: 90,  label: 'Cuti Melahirkan (3 bulan, wajib cari pengganti)' },
    ISTRI_MELAHIRKAN: { maxHari: 3,   label: 'Cuti Istri Melahirkan (3 hari)' },
    IZIN:             { maxHari: null, label: 'Izin (koordinasi dengan tim)' }
  },

  // Link ke app lain
  APPS: {
    ATTENDANCE: 'https://rifim-attendance.vercel.app'
  },

  BULAN: ['Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember']
};
