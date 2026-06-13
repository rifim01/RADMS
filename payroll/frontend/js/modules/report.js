/**
 * report.js — Modul Laporan
 */

const Report = (() => {
  async function load() {
    populateCabangSelect('rptCabang', true);
    const today = new Date().toISOString().substring(0, 10);
    const firstDay = today.substring(0, 7) + '-01';
    if (document.getElementById('rptStart')) document.getElementById('rptStart').value = firstDay;
    if (document.getElementById('rptEnd'))   document.getElementById('rptEnd').value   = today;
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

  return { load, generate, exportCSV, print };
})();
