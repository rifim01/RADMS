/**
 * report.js — Modul Laporan
 */

const Report = (() => {
  let _staffCache = [];

  async function load() {
    const user = Auth.getUser();
    populateCabangSelect('rptCabang', user.role !== 'ADMIN_CABANG');
    if (user.role === 'ADMIN_CABANG') {
      const sel = document.getElementById('rptCabang');
      if (sel) { sel.value = user.idCabang; sel.disabled = true; }
    }
    const today = new Date().toISOString().substring(0, 10);
    const firstDay = today.substring(0, 7) + '-01';
    const s = document.getElementById('rptStart'), e = document.getElementById('rptEnd');
    if (s && !s.value) s.value = firstDay;
    if (e && !e.value) e.value = today;

    const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';
    const staffRes = await API.getStaff(idCabang);
    _staffCache = staffRes.success ? (staffRes.data || []) : [];
    _populateStaffSelect();
  }

  function _populateStaffSelect() {
    const sel = document.getElementById('rptStaff');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Pilih Staff (untuk PDF per staff) —</option>' +
      _staffCache.map(s => `<option value="${s.id}">${s.nama} (${s.id_cabang})</option>`).join('');
  }

  async function generate() {
    const type     = document.getElementById('rptType')?.value;
    const idCabang = document.getElementById('rptCabang')?.value;
    const start    = document.getElementById('rptStart')?.value;
    const end      = document.getElementById('rptEnd')?.value;

    if (!type) { toast('Pilih jenis laporan', 'warning'); return; }

    showLoading(true);
    try {
      const res = await API.getReport(type, idCabang, start, end);
      if (!res.success) throw new Error(res.error);
      renderReport(res, type);
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  function renderReport(res, type) {
    const el = document.getElementById('reportOutput');
    if (!el) return;

    const titles = { payroll: 'Laporan Payroll', attendance: 'Laporan Absensi',
                     staff: 'Data Staff', cuti: 'Laporan Cuti' };

    let tableHTML = '';
    if (type === 'payroll') {
      tableHTML = `<table><thead><tr>
        <th>Staff</th><th>Cabang</th><th>Periode</th><th>Gapok</th>
        <th>Potongan</th><th>Bersih</th><th>Slip</th>
      </tr></thead><tbody>` +
        (res.data || []).map(d => `<tr>
          <td>${d.nama}</td><td>${d.id_cabang}</td><td>${formatPeriode(d.periode)}</td>
          <td>${formatRp(d.gapok)}</td><td class="text-red">${formatRp(d.total_potongan)}</td>
          <td><strong>${formatRp(d.gaji_bersih)}</strong></td>
          <td>${d.slip_pdf_url ? `<a href="${d.slip_pdf_url}" target="_blank" class="btn btn-sm btn-yellow">PDF</a>` : '-'}</td>
        </tr>`).join('') + `</tbody></table>`;
    } else if (type === 'attendance') {
      tableHTML = `<table><thead><tr>
        <th>Tanggal</th><th>Nama</th><th>Cabang</th><th>Status</th><th>Waktu</th>
      </tr></thead><tbody>` +
        (res.data || []).map(a => `<tr>
          <td>${formatTanggal(a.tanggal)}</td><td>${a.nama}</td><td>${a.id_cabang}</td>
          <td><span class="badge ${a.status === 'Masuk' ? 'badge-green' : 'badge-blue'}">${a.status}</span></td>
          <td>${a.timestamp?.substring(11, 16) || '-'}</td>
        </tr>`).join('') + `</tbody></table>`;
    } else if (type === 'staff') {
      tableHTML = `<table><thead><tr>
        <th>Nama</th><th>Jabatan</th><th>Cabang</th><th>Gapok</th><th>Status</th>
      </tr></thead><tbody>` +
        (res.data || []).map(s => `<tr>
          <td>${s.nama}</td><td>${s.jabatan || '-'}</td><td>${s.id_cabang}</td>
          <td>${formatRp(s.gapok)}</td>
          <td><span class="badge ${s.status === 'AKTIF' ? 'badge-green' : 'badge-gray'}">${s.status}</span></td>
        </tr>`).join('') + `</tbody></table>`;
    } else if (type === 'cuti') {
      tableHTML = `<table><thead><tr>
        <th>Nama</th><th>Jenis</th><th>Mulai</th><th>Selesai</th><th>Hari</th><th>Status</th>
      </tr></thead><tbody>` +
        (res.data || []).map(c => `<tr>
          <td>${c.nama}</td>
          <td><span class="badge badge-blue">${c.jenis_cuti}</span></td>
          <td>${formatTanggal(c.tanggal_mulai)}</td>
          <td>${formatTanggal(c.tanggal_selesai)}</td>
          <td>${c.jumlah_hari}</td>
          <td><span class="badge ${c.status === 'APPROVED' ? 'badge-green' : 'badge-red'}">${c.status}</span></td>
        </tr>`).join('') + `</tbody></table>`;
    }

    el.innerHTML = `
      <div class="d-flex align-center gap-3 mb-3" style="justify-content:space-between">
        <h3>${titles[type]}</h3>
        <div class="d-flex gap-2">
          <span class="text-muted">Total: ${res.total || (res.data || []).length} data</span>
          <button class="btn btn-sm btn-outline" onclick="Report.exportCSV()">Export CSV</button>
          <button class="btn btn-sm btn-yellow" onclick="Report.print()">Print</button>
        </div>
      </div>
      <div class="table-wrapper">${tableHTML}</div>`;
  }

  function exportCSV() {
    const table = document.querySelector('#reportOutput table');
    if (!table) { toast('Tidak ada data untuk di-export', 'warning'); return; }

    const rows = [];
    table.querySelectorAll('tr').forEach(row => {
      const cells = [...row.querySelectorAll('th,td')].map(c => `"${c.textContent.trim()}"`);
      rows.push(cells.join(','));
    });

    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `laporan-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Export CSV berhasil', 'success');
  }

  function print() {
    const content = document.getElementById('reportOutput')?.innerHTML;
    if (!content) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Laporan RIFIM</title>
      <style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}
      th{background:#CC0000;color:white;padding:6px}td{padding:5px;border:1px solid #ddd}</style>
      </head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  }

  // ── PDF per Cabang ─────────────────────────────────────────────────────────
  async function exportPDFCabang() {
    const idCabang = document.getElementById('rptCabang')?.value;
    const start    = document.getElementById('rptStart')?.value;
    const end      = document.getElementById('rptEnd')?.value;
    const type     = document.getElementById('rptType')?.value || 'payroll';
    if (!start || !end) { toast('Pilih periode terlebih dahulu', 'warning'); return; }

    showLoading(true);
    try {
      const [res, staffRes] = await Promise.all([
        API.getReport(type, idCabang, start, end),
        API.getStaff(idCabang)
      ]);
      const data  = res.success      ? (res.data      || []) : [];
      const staff = staffRes.success ? (staffRes.data || []) : [];
      const cabang = (APP_CONFIG.CABANG || []).find(c => c.id === idCabang);
      const cabangNama = cabang ? cabang.nama : (idCabang || 'Semua Cabang');
      _openPrintWindow(_buildCabangHTML(data, staff, type, cabangNama, start, end));
    } catch (e) { toast('Gagal export: ' + e.message, 'error'); }
    finally { showLoading(false); }
  }

  function _buildCabangHTML(data, staff, type, cabangNama, start, end) {
    const tipeLabel = { payroll: 'Payroll', attendance: 'Absensi', staff: 'Data Staff', cuti: 'Cuti' };
    const cols = data.length ? Object.keys(data[0]) : [];
    return `
      <div class="header">
        <div class="logo">RIFIM</div>
        <div>
          <div class="company">PT. RIFIM INTERNATIONAL GEMILANG</div>
          <div class="report-title">LAPORAN ${(tipeLabel[type] || type).toUpperCase()} — ${cabangNama.toUpperCase()}</div>
          <div class="period">Periode: ${start} s/d ${end} &nbsp;·&nbsp; Total staff: ${staff.length}</div>
        </div>
      </div>
      <table>
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${data.map(row => `<tr>${cols.map(c => `<td>${row[c] ?? '-'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      <div class="footer">Dicetak: ${new Date().toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})} &nbsp;·&nbsp; RIFIM Payroll System</div>`;
  }

  // ── PDF per Staff ───────────────────────────────────────────────────────────
  async function exportPDFStaff() {
    const idStaff  = document.getElementById('rptStaff')?.value;
    const start    = document.getElementById('rptStart')?.value;
    const end      = document.getElementById('rptEnd')?.value;
    const idCabang = document.getElementById('rptCabang')?.value;
    if (!idStaff) { toast('Pilih staff terlebih dahulu untuk PDF per staff', 'warning'); return; }
    if (!start || !end) { toast('Pilih periode terlebih dahulu', 'warning'); return; }

    showLoading(true);
    try {
      const [staffRes, absRes, kasbonRes] = await Promise.all([
        API.getStaffById(idStaff),
        API.getAbsensi({ idCabang, startDate: start, endDate: end }),
        API.getKasbon(idStaff)
      ]);
      const staff  = staffRes.success  ? staffRes.data : null;
      const absen  = absRes.success    ? (absRes.data  || []).filter(a => a.id_staff === idStaff) : [];
      const kasbon = kasbonRes.success ? (kasbonRes.data || []) : [];
      if (!staff) { toast('Data staff tidak ditemukan', 'error'); return; }
      _openPrintWindow(_buildStaffHTML(staff, absen, kasbon, start, end));
    } catch (e) { toast('Gagal export: ' + e.message, 'error'); }
    finally { showLoading(false); }
  }

  function _buildStaffHTML(staff, absen, kasbon, start, end) {
    const hadir = absen.filter(a => a.status === 'Masuk' || a.status === 'HADIR').length;
    const totalKasbon = kasbon.reduce((s, k) => s + Number(k.jumlah || 0), 0);
    return `
      <div class="header">
        <div class="logo">RIFIM</div>
        <div>
          <div class="company">PT. RIFIM INTERNATIONAL GEMILANG</div>
          <div class="report-title">LAPORAN INDIVIDUAL KARYAWAN</div>
          <div class="period">Periode: ${start} s/d ${end}</div>
        </div>
      </div>
      <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin-bottom:20px">
        <table style="width:100%;font-size:12px">
          <tr><td style="width:140px;color:#666">Nama</td><td><strong>${staff.nama}</strong></td>
              <td style="width:140px;color:#666">Jabatan</td><td>${staff.jabatan || '-'}</td></tr>
          <tr><td style="color:#666">Email</td><td>${staff.email}</td>
              <td style="color:#666">Cabang</td><td>${staff.id_cabang}</td></tr>
          <tr><td style="color:#666">Gaji Pokok</td><td><strong>Rp ${Number(staff.gapok||0).toLocaleString('id-ID')}</strong></td>
              <td style="color:#666">Status</td><td>${staff.status}</td></tr>
        </table>
      </div>
      <h3 style="font-size:13px;margin-bottom:8px">Rekap Absensi (${hadir} hari hadir dari ${absen.length} record)</h3>
      <table>
        <thead><tr><th>Tanggal</th><th>Status</th><th>Metode</th><th>Jam Masuk</th></tr></thead>
        <tbody>${absen.map(a => `<tr>
          <td>${a.tanggal || '-'}</td><td>${a.status}</td>
          <td>${a.method || 'manual'}</td>
          <td>${a.jam_masuk || a.timestamp?.substring(11,16) || '-'}</td>
        </tr>`).join('')}</tbody>
      </table>
      ${kasbon.length ? `
      <h3 style="font-size:13px;margin:16px 0 8px">Kasbon (Total: Rp ${totalKasbon.toLocaleString('id-ID')})</h3>
      <table>
        <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Keterangan</th><th>Status</th></tr></thead>
        <tbody>${kasbon.map(k => `<tr>
          <td>${k.tanggal||'-'}</td>
          <td>Rp ${Number(k.jumlah||0).toLocaleString('id-ID')}</td>
          <td>${k.keterangan||'-'}</td><td>${k.status}</td>
        </tr>`).join('')}</tbody>
      </table>` : ''}
      <div class="footer">Dicetak: ${new Date().toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})} &nbsp;·&nbsp; RIFIM Payroll System</div>`;
  }

  function _openPrintWindow(bodyContent) {
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Laporan RIFIM</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:24px;font-size:12px;color:#222}
        .header{display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;border-bottom:2px solid #CC0000;padding-bottom:12px}
        .logo{font-size:28px;font-weight:900;color:#CC0000;letter-spacing:-1px}
        .company{font-size:11px;color:#666}
        .report-title{font-size:16px;font-weight:700;margin:4px 0}
        .period{font-size:11px;color:#666}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        th{background:#1A3A6B;color:white;padding:8px;text-align:left;font-size:11px}
        td{padding:6px 8px;border-bottom:1px solid #eee;font-size:11px}
        tr:nth-child(even){background:#f9f9f9}
        .footer{margin-top:20px;font-size:10px;color:#aaa;text-align:right;border-top:1px solid #eee;padding-top:8px}
        .print-btn{background:#CC0000;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;margin-bottom:16px}
        @media print{.print-btn{display:none}}
      </style>
    </head><body>
      <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      ${bodyContent}
    </body></html>`);
    win.document.close();
  }

  // ── Excel per Cabang ────────────────────────────────────────────────────────
  async function exportExcelCabang() {
    const idCabang = document.getElementById('rptCabang')?.value;
    const start    = document.getElementById('rptStart')?.value;
    const end      = document.getElementById('rptEnd')?.value;
    const type     = document.getElementById('rptType')?.value || 'payroll';
    if (!start || !end) { toast('Pilih periode terlebih dahulu', 'warning'); return; }

    showLoading(true);
    try {
      const [res, staffRes] = await Promise.all([
        API.getReport(type, idCabang, start, end),
        API.getStaff(idCabang)
      ]);
      const data  = res.success      ? (res.data      || []) : [];
      const staff = staffRes.success ? (staffRes.data || []) : [];
      const cabang = (APP_CONFIG.CABANG || []).find(c => c.id === idCabang);
      const nama   = cabang ? cabang.nama : (idCabang || 'Semua Cabang');
      _downloadExcel(data, `Laporan-${type}-${nama}-${start}-${end}`,
        `Laporan ${type.toUpperCase()} | ${nama} | ${start} s/d ${end} | ${staff.length} staff`);
    } catch (e) { toast('Gagal export: ' + e.message, 'error'); }
    finally { showLoading(false); }
  }

  // ── Excel per Staff ──────────────────────────────────────────────────────────
  async function exportExcelStaff() {
    const idStaff  = document.getElementById('rptStaff')?.value;
    const start    = document.getElementById('rptStart')?.value;
    const end      = document.getElementById('rptEnd')?.value;
    const idCabang = document.getElementById('rptCabang')?.value;
    if (!idStaff) { toast('Pilih staff terlebih dahulu', 'warning'); return; }
    if (!start || !end) { toast('Pilih periode terlebih dahulu', 'warning'); return; }

    showLoading(true);
    try {
      const [staffRes, absRes, kasbonRes] = await Promise.all([
        API.getStaffById(idStaff),
        API.getAbsensi({ idCabang, startDate: start, endDate: end }),
        API.getKasbon(idStaff)
      ]);
      const staff  = staffRes.success  ? staffRes.data : {};
      const absen  = absRes.success    ? (absRes.data || []).filter(a => a.id_staff === idStaff) : [];
      const kasbon = kasbonRes.success ? (kasbonRes.data || []) : [];

      // Gabungkan 2 sheet: absensi + kasbon
      const rowsAbsen  = absen.map(a => ({ Tanggal: a.tanggal, Status: a.status, 'Jam Masuk': a.jam_masuk || '-', 'Jam Keluar': a.jam_keluar || '-' }));
      const rowsKasbon = kasbon.map(k => ({ Tanggal: k.tanggal, 'Jumlah (Rp)': k.jumlah, Keterangan: k.keterangan, Status: k.status }));

      const titleLine = `${staff.nama || ''} | ${staff.jabatan || ''} | ${staff.id_cabang || ''} | ${start} s/d ${end}`;
      _downloadExcelMultiSheet(
        [{ nama: 'Absensi', data: rowsAbsen }, { nama: 'Kasbon', data: rowsKasbon }],
        `Laporan-Staff-${(staff.nama || idStaff).replace(/\s+/g,'-')}-${start}`,
        titleLine
      );
    } catch (e) { toast('Gagal export: ' + e.message, 'error'); }
    finally { showLoading(false); }
  }

  // Helper: download single-sheet Excel (HTML table as .xls)
  function _downloadExcel(data, filename, subtitle) {
    if (!data.length) { toast('Tidak ada data untuk di-export', 'warning'); return; }
    const cols = Object.keys(data[0]);
    const tableHtml = `
      <table border="1">
        <tr><th colspan="${cols.length}" style="background:#1A3A6B;color:white;font-size:14px">PT. RIFIM INTERNATIONAL GEMILANG</th></tr>
        <tr><td colspan="${cols.length}">${subtitle}</td></tr>
        <tr>${cols.map(c => `<th style="background:#F7C520;font-weight:bold">${c}</th>`).join('')}</tr>
        ${data.map(row => `<tr>${cols.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`).join('')}
      </table>`;
    _saveAsXls(tableHtml, filename);
    toast('Export Excel berhasil', 'success');
  }

  // Helper: download multi-sheet Excel (separate tables)
  function _downloadExcelMultiSheet(sheets, filename, subtitle) {
    let html = `<style>th{background:#1A3A6B;color:white}td,th{border:1px solid #ccc;padding:4px}</style>`;
    html += `<p><strong>PT. RIFIM INTERNATIONAL GEMILANG</strong><br>${subtitle}</p>`;
    sheets.forEach(s => {
      html += `<h3>${s.nama}</h3>`;
      if (!s.data.length) { html += '<p>(tidak ada data)</p>'; return; }
      const cols = Object.keys(s.data[0]);
      html += `<table border="1">
        <tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>
        ${s.data.map(row => `<tr>${cols.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`).join('')}
      </table><br>`;
    });
    _saveAsXls(html, filename);
    toast('Export Excel berhasil', 'success');
  }

  function _saveAsXls(html, filename) {
    const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml>
        <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Laporan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head><body>${html}</body></html>`;
    const blob = new Blob(['﻿' + full], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename + '.xls';
    a.click();
    URL.revokeObjectURL(url);
  }

  return { load, generate, exportCSV, print, exportPDFCabang, exportPDFStaff, exportExcelCabang, exportExcelStaff };
})();
