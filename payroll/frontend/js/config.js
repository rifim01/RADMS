/**
 * config.js — Konfigurasi global aplikasi
 * Ganti GAS_URL dengan URL deployment Google Apps Script kamu
 */

window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbze5uExLZ8mukFg0uC5xQ_Z71EeSrKTNa9h8aq0fxib57HfmY09UPaz1sWfFYs4ees/exec',
  APP_NAME: 'RIFIM Payroll',
  VERSION: '1.0.0',

  CABANG: [
    { id: 'BTM-APT', nama: 'ID Rifim Airport Batam' },
    { id: 'JMB-APT', nama: 'ID Rifim Airport Jambi' },
    { id: 'BPN-APT', nama: 'ID Rifim Airport Balikpapan' },
    { id: 'MDO-APT', nama: 'ID Rifim Airport Manado' },
    { id: 'PKU-APT', nama: 'ID Rifim Airport Pekanbaru' },
    { id: 'BTM-OFF', nama: 'ID Rifim Batam' },
    { id: 'JMB-OFF', nama: 'ID Rifim Jambi Luar' }
  ],

  ROLES: {
    OWNER:         'Owner',
    SUPER_ADMIN:   'Super Admin',
    ADMIN_CABANG:  'Admin Cabang',
    STAFF:         'Staff'
  },

  JENIS_CUTI: ['TAHUNAN', 'SAKIT', 'MENIKAH', 'HAMIL', 'IZIN'],

  BULAN: ['Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember']
};
