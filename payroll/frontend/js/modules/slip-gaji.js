/**
 * slip-gaji.js — Modul Slip Gaji per Karyawan
 */

const SlipGaji = (() => {
  let _staffCache = [];
  let _lastSlip   = null;

  async function load() {
    const user = Auth.getUser();
    populateCabangSelect('sgCabang', user.role !== 'ADMIN_CABANG');
    if (user.role === 'ADMIN_CABANG') {
      const sel = document.getElementById('sgCabang');
      if (sel) { sel.value = user.idCabang; sel.disabled = true; }
    }
    populatePeriodeSelect('sgPeriode');

    const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';
    const res = await API.getStaff(idCabang);
    _staffCache = res.success ? (res.data || []) : [];
    _populateStaffSelect();

    document.getElementById('sgCabang')?.addEventListener('change', _onCabangChange);
  }

  async function _onCabangChange() {
    const idCabang = document.getElementById('sgCabang')?.value;
    const res = await API.getStaff(idCabang);
    _staffCache = res.success ? (res.data || []) : [];
    _populateStaffSelect();
  }

  function _populateStaffSelect() {
    const sel = document.getElementById('sgStaff');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Pilih Staff —</option>' +
      _staffCache.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
  }

  async function cari() {
    const idStaff = document.getElementById('sgStaff')?.value;
    const periode = document.getElementById('sgPeriode')?.value;
    const el = document.getElementById('slipGajiOutput');

    if (!idStaff || !periode) {
      toast('Pilih staff dan periode', 'warning'); return;
    }

    showLoading(true);
    try {
      const res = await API.getPayrollSlip(idStaff, periode);
      if (!res.success) throw new Error(res.error || 'Slip tidak ditemukan untuk periode ini');
      _lastSlip = res.data;
      _renderSlip(res.data, el);
    } catch (e) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-text">${e.message}</div>
      </div>`;
    } finally {
      showLoading(false);
    }
  }

  function _renderSlip(d, el) {
    if (!d) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div>
        <div class="empty-text">Tidak ada slip untuk periode ini</div></div>`;
      return;
    }

    const gapok         = Number(d.gapok || 0);
    const tunjanganList = d.tunjangan || [];
    const totalTunjangan = tunjanganList.reduce((s, t) => s + Number(t.jumlah || 0), 0);
    const potonganList   = d.potongan || [];
    const totalPotongan  = potonganList.reduce((s, p) => s + Number(p.jumlah || 0), 0);
    const lembur         = Number(d.total_lembur || 0);
    const kasbon         = Number(d.total_kasbon || 0);
    const bersih         = Number(d.gaji_bersih || (gapok + totalTunjangan + lembur - totalPotongan - kasbon));

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:14px;font-weight:700">SLIP GAJI — ${formatPeriode(d.periode)}</div>
          <div style="font-size:12px;color:#666">Dicetak: ${new Date().toLocaleDateString('id-ID')}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="SlipGaji.cetakSlip()">🖨️ Cetak / PDF</button>
          <button class="btn btn-secondary" onclick="SlipGaji.bagikanWA()">📱 WhatsApp</button>
        </div>
      </div>
      <div id="slipCetakArea">
        <div style="background:#f8f9fa;padding:14px;border-radius:8px;margin-bottom:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
            <div><span style="color:#666">Nama</span><br><strong>${d.nama || '-'}</strong></div>
            <div><span style="color:#666">Jabatan</span><br>${d.jabatan || '-'}</div>
            <div><span style="color:#666">Cabang</span><br>${d.id_cabang || '-'}</div>
            <div><span style="color:#666">Periode</span><br>${formatPeriode(d.periode)}</div>
          </div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th style="width:60%">Komponen</th><th style="text-align:right">Jumlah</th></tr></thead>
            <tbody>
              <tr><td colspan="2" style="background:#e8f4f8;font-weight:600;font-size:11px;padding:6px 8px">PENDAPATAN</td></tr>
              <tr><td>Gaji Pokok</td><td style="text-align:right">${formatRp(gapok)}</td></tr>
              ${tunjanganList.map(t => `<tr><td>${t.nama || 'Tunjangan'}</td><td style="text-align:right">${formatRp(t.jumlah)}</td></tr>`).join('')}
              ${lembur ? `<tr><td>Lembur</td><td style="text-align:right">${formatRp(lembur)}</td></tr>` : ''}
              <tr style="font-weight:600;background:#f0f8f0">
                <td>Total Pendapatan</td>
                <td style="text-align:right">${formatRp(gapok + totalTunjangan + lembur)}</td>
              </tr>
              <tr><td colspan="2" style="background:#fef3e2;font-weight:600;font-size:11px;padding:6px 8px">POTONGAN</td></tr>
              ${potonganList.map(p => `<tr><td>${p.nama || 'Potongan'}</td><td style="text-align:right;color:#c0392b">(${formatRp(p.jumlah)})</td></tr>`).join('')}
              ${kasbon ? `<tr><td>Cicilan Kasbon</td><td style="text-align:right;color:#c0392b">(${formatRp(kasbon)})</td></tr>` : ''}
              ${totalPotongan || kasbon ? `<tr style="font-weight:600;background:#fdf0f0">
                <td>Total Potongan</td>
                <td style="text-align:right;color:#c0392b">(${formatRp(totalPotongan + kasbon)})</td>
              </tr>` : ''}
              <tr style="font-weight:700;font-size:14px;background:#1A3A6B;color:white">
                <td>GAJI BERSIH</td>
                <td style="text-align:right">${formatRp(bersih)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${d.catatan ? `<div style="margin-top:12px;font-size:12px;color:#666">Catatan: ${d.catatan}</div>` : ''}
        <div style="margin-top:20px;font-size:11px;color:#aaa;text-align:center">
          Slip gaji ini diterbitkan oleh sistem RIFIM Payroll — PT. Rifim International Gemilang
        </div>
      </div>`;
  }

  function cetakSlip() {
    const area = document.getElementById('slipCetakArea');
    if (!area) return;
    const win = window.open('', '_blank', 'width=700,height=600');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Slip Gaji RIFIM</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#222}
        table{width:100%;border-collapse:collapse;margin-bottom:12px}
        th{background:#1A3A6B;color:white;padding:8px;text-align:left;font-size:11px}
        td{padding:6px 8px;border-bottom:1px solid #eee;font-size:11px}
        .print-btn{background:#CC0000;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;margin-bottom:14px}
        @media print{.print-btn{display:none}}
      </style>
    </head><body>
      <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      <div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #CC0000;padding-bottom:10px">
        <div style="font-size:20px;font-weight:900;color:#CC0000">RIFIM</div>
        <div style="font-size:11px;color:#666">PT. RIFIM INTERNATIONAL GEMILANG</div>
        <div style="font-size:14px;font-weight:700;margin-top:4px">SLIP GAJI KARYAWAN</div>
      </div>
      ${area.innerHTML}
    </body></html>`);
    win.document.close();
  }

  function bagikanWA() {
    const d = _lastSlip;
    if (!d) { toast('Tidak ada slip untuk dibagikan', 'warning'); return; }

    const gapok   = Number(d.gapok || 0);
    const lembur  = Number(d.total_lembur || 0);
    const kasbon  = Number(d.total_kasbon || 0);
    const bersih  = Number(d.gaji_bersih || (gapok + lembur - kasbon));
    const rp      = n => 'Rp ' + Number(n||0).toLocaleString('id-ID');

    const pesan = [
      `*SLIP GAJI KARYAWAN*`,
      `PT. Rifim International Gemilang`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 Nama    : ${d.nama || '-'}`,
      `🏢 Cabang  : ${d.id_cabang || '-'}`,
      `💼 Jabatan : ${d.jabatan || '-'}`,
      `📅 Periode : ${formatPeriode(d.periode)}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 Gaji Pokok   : ${rp(gapok)}`,
      lembur  ? `⏰ Lembur        : ${rp(lembur)}`  : '',
      kasbon  ? `💸 Cicilan Kasbon: (${rp(kasbon)})` : '',
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ *GAJI BERSIH : ${rp(bersih)}*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `_Dikirim via RIFIM Payroll System_`
    ].filter(Boolean).join('\n');

    const nomor = d.nomor_hp || '';
    const url   = `https://wa.me/${nomor.replace(/\D/g,'')}?text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
  }

  return { load, cari, cetakSlip, bagikanWA };
})();
