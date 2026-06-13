/**
 * api.js — Wrapper untuk semua panggilan ke Google Apps Script
 */

const API = (() => {
  const BASE = () => window.APP_CONFIG.GAS_URL;

  async function get(action, params = {}) {
    const token = Auth.getToken();
    const qs = new URLSearchParams({ action, token, ...params }).toString();
    const res = await fetch(`${BASE()}?${qs}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function post(action, data = {}) {
    const token = Auth.getToken();
    const res = await fetch(BASE(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, token, ...data })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // GAS tidak support CORS preflight, pakai no-cors workaround dengan mode text/plain
  async function postForm(action, data = {}) {
    const token = Auth.getToken();
    const body  = JSON.stringify({ action, token, ...data });
    const res = await fetch(BASE(), {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    return res.json();
  }

  return {
    // Auth
    login:        (email, pw)      => postForm('login', { email, password: pw }),
    getCabang:    ()               => get('getCabang'),

    // Dashboard
    getDashboard: (idCabang, tgl)  => get('getDashboard', { idCabang, tanggal: tgl }),

    // Staff
    getStaff:     (idCabang)       => get('getStaff', { idCabang }),
    getStaffById: (id)             => get('getStaffById', { id }),
    addStaff:     (data)           => postForm('addStaff', { data }),
    updateStaff:  (id, data)       => postForm('updateStaff', { id, data }),
    deleteStaff:  (id)             => postForm('deleteStaff', { id }),

    // Absensi
    getAbsensi:     (p)            => get('getAbsensi', p),
    getSummaryAbsensi:(idCabang,tgl)=> get('getSummaryAbsensi', { idCabang, tanggal: tgl }),
    addAbsensi:     (data)         => postForm('addAbsensi', { data }),
    bulkHadir:      (idCabang,tgl) => postForm('bulkHadir', { idCabang, tanggal: tgl }),

    // Payroll
    getPayrollRuns:    (idCabang,tahun) => get('getPayrollRuns', { idCabang, tahun }),
    getPayrollDetail:  (payrollId)      => get('getPayrollDetail', { payrollId }),
    getPayrollSlip:    (idStaff,periode)=> get('getPayrollSlip', { idStaff, periode }),
    generatePayroll:   (periode,idCabang) => postForm('generatePayroll', { periode, idCabang }),
    updatePayrollDetail:(id,data)       => postForm('updatePayrollDetail', { id, data }),
    finalizePayroll:   (payrollId)      => postForm('finalizePayroll', { payrollId }),
    generateSlipPDF:   (detailId)       => postForm('generateSlipPDF', { detailId }),
    generateAllSlips:  (payrollId)      => postForm('generateAllSlips', { payrollId }),

    // Lembur
    getLembur:     (idCabang, periode) => get('getLembur', { idCabang, periode }),
    addLembur:     (data)              => postForm('addLembur', { data }),
    approveLembur: (id)                => postForm('approveLembur', { id }),
    rejectLembur:  (id)                => postForm('rejectLembur', { id }),

    // Kasbon
    getKasbon:  (idStaff) => get('getKasbon', { idStaff }),
    addKasbon:  (data)    => postForm('addKasbon', { data }),

    // Cuti
    getCuti:       (idCabang, status) => get('getCuti', { idCabang, status }),
    getCutiKuota:  (idStaff, tahun)   => get('getCutiKuota', { idStaff, tahun }),
    ajukanCuti:    (data)             => postForm('ajukanCuti', { data }),
    approveCuti:   (id)               => postForm('approveCuti', { id }),
    rejectCuti:    (id, alasan)       => postForm('rejectCuti', { id, alasan }),

    // Report
    getReport: (type, idCabang, s, e) => get('getReport', { type, idCabang, startDate: s, endDate: e }),

    // ID Card
    generateIDCard: (idStaff) => postForm('generateIDCard', { idStaff }),

    // Settings
    gantiPassword:       (passwordLama, passwordBaru) => postForm('gantiPassword', { passwordLama, passwordBaru }),
    syncStaffFromMaster: ()                           => postForm('syncStaffFromMaster', {}),
    syncAbsensiFromERP:  (tanggalMulai, tanggalSelesai) => postForm('syncAbsensiFromERP', { tanggalMulai, tanggalSelesai })
  };
})();
