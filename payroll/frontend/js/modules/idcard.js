/**
 * idcard.js — ID Card Generator (desain kartu kuning RIFIM Airport)
 *
 * Desain mengacu pada kartu-id-rifim.html:
 *   Depan: header putih, badge kuning "ID RIFIM AIRPORT", section cabang kuning,
 *          foto bulat, nama/jabatan, info rows
 *   Belakang: QR code, Nomor ID, ketentuan, footer RIFIM values
 */

const IDCard = (() => {
  let staffList = [];

  // ── Warna & Style Kartu ────────────────────────────────────────────────────
  const YELLOW = '#F7C520';
  const NAVY   = '#1A3A6B';
  const WHITE  = '#FFFFFF';

  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';
      const res = await API.getStaff(idCabang);
      if (!res.success) throw new Error(res.error);
      staffList = res.data || [];
      renderStaffGrid(staffList);
      populateCabangSelect('idcCabang', true);
    } catch (e) {
      toast('Gagal memuat data: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function _getCabangInfo(idCabang) {
    return APP_CONFIG.CABANG.find(c => c.id === idCabang) || { kota: idCabang, bandara: '' };
  }

  // ── Nomor ID visual (misal MDO-0001) ──────────────────────────────────────
  function _formatNomorId(staff, index) {
    const prefix = staff.id_cabang ? staff.id_cabang.split('-')[0] : 'RFM';
    const num    = String(index + 1).padStart(4, '0');
    return `${prefix}-${num}`;
  }

  // ── Render kartu depan sebagai HTML string ─────────────────────────────────
  function _cardFrontHtml(staff, nomorId) {
    const cabang    = _getCabangInfo(staff.id_cabang);
    const photoSrc  = staff.foto || '';
    const photoHtml = photoSrc
      ? `<img src="${photoSrc}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${YELLOW}">`
      : `<div style="width:80px;height:80px;border-radius:50%;background:${YELLOW};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:${NAVY};border:3px solid ${NAVY}">${(staff.nama||'?').charAt(0).toUpperCase()}</div>`;

    return `
      <div style="width:252px;min-height:390px;background:${WHITE};border-radius:14px;
                  box-shadow:0 4px 18px rgba(0,0,0,0.18);font-family:Arial,sans-serif;
                  overflow:hidden;display:inline-block;vertical-align:top">

        <!-- Header putih dengan logo -->
        <div style="background:${WHITE};padding:10px 12px 6px;display:flex;align-items:center;gap:8px;border-bottom:2px solid ${YELLOW}">
          <div style="font-size:22px;font-weight:900;color:#CC0000;letter-spacing:-1px">RIFIM</div>
          <div style="flex:1;text-align:right;font-size:8px;color:${NAVY};line-height:1.3;font-weight:600">
            PT RIFIM<br>INTERNATIONAL<br>GEMILANG
          </div>
        </div>

        <!-- Badge kuning -->
        <div style="background:${YELLOW};text-align:center;padding:5px 0;font-size:11px;
                    font-weight:800;color:${NAVY};letter-spacing:1.5px">
          ID RIFIM AIRPORT
        </div>

        <!-- Section cabang kuning -->
        <div style="background:${YELLOW};padding:8px 12px 10px;text-align:center">
          <div style="font-size:9px;color:${NAVY};font-weight:600;letter-spacing:.8px;opacity:.8">CABANG</div>
          <div style="font-size:17px;font-weight:900;color:${NAVY};line-height:1.1">${cabang.kota}</div>
          <div style="font-size:8px;color:${NAVY};font-weight:600;opacity:.75">${cabang.bandara}</div>
        </div>

        <!-- Foto + info -->
        <div style="padding:12px;text-align:center">
          ${photoHtml}
          <div style="margin-top:8px;font-size:14px;font-weight:800;color:${NAVY}">${staff.nama || '-'}</div>
          <div style="font-size:10px;color:#555;margin-top:2px">${staff.jabatan || 'Staff'}</div>
          <div style="margin-top:8px;font-size:9px;color:#777">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee">
              <span>No. ID</span><span style="font-weight:700;color:${NAVY}">${nomorId}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee">
              <span>Email</span><span style="font-weight:600;font-size:8px">${staff.email || '-'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0">
              <span>Status</span><span style="font-weight:700;color:green">${staff.status || 'AKTIF'}</span>
            </div>
          </div>
        </div>

        <!-- Footer strip -->
        <div style="background:${NAVY};color:${YELLOW};text-align:center;padding:5px;
                    font-size:8px;font-weight:700;letter-spacing:1px">
          KARTU IDENTITAS KARYAWAN
        </div>
      </div>`;
  }

  // ── Render kartu belakang sebagai HTML string ──────────────────────────────
  function _cardBackHtml(staff, nomorId) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(staff.id)}`;
    return `
      <div style="width:252px;min-height:390px;background:${WHITE};border-radius:14px;
                  box-shadow:0 4px 18px rgba(0,0,0,0.18);font-family:Arial,sans-serif;
                  overflow:hidden;display:inline-block;vertical-align:top;margin-left:12px">

        <!-- Header -->
        <div style="background:${NAVY};padding:10px 12px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:${YELLOW};letter-spacing:-1px">RIFIM</div>
          <div style="font-size:8px;color:rgba(255,255,255,.8);letter-spacing:.5px">PT RIFIM INTERNATIONAL GEMILANG</div>
        </div>

        <!-- QR Code -->
        <div style="text-align:center;padding:14px 12px 8px">
          <img src="${qrUrl}" style="border:3px solid ${YELLOW};border-radius:8px;padding:4px">
          <div style="font-size:13px;font-weight:800;color:${NAVY};margin-top:8px">${nomorId}</div>
          <div style="font-size:9px;color:#888">Scan untuk verifikasi identitas</div>
        </div>

        <!-- Ketentuan -->
        <div style="padding:0 14px;font-size:8px;color:#555;line-height:1.6">
          <div style="font-weight:700;color:${NAVY};margin-bottom:4px;font-size:9px">KETENTUAN KARTU:</div>
          <ol style="margin:0;padding-left:14px">
            <li>Kartu ini milik PT Rifim International Gemilang</li>
            <li>Wajib dipakai saat bertugas di area bandara</li>
            <li>Jika hilang/rusak, laporkan ke Admin segera</li>
            <li>Tidak dapat dipindahtangankan</li>
          </ol>
        </div>

        <!-- Footer RIFIM values -->
        <div style="background:${YELLOW};padding:8px 12px;margin-top:12px;text-align:center">
          <div style="font-size:7px;font-weight:700;color:${NAVY};letter-spacing:1px">
            RELIABLE · INTEGRITY · FAST · INNOVATIVE · MOTIVATED
          </div>
        </div>
      </div>`;
  }

  // ── Render Grid ────────────────────────────────────────────────────────────
  function renderStaffGrid(data) {
    const el = document.getElementById('idcGrid');
    if (!el) return;

    if (!data.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🪪</div><div class="empty-text">Tidak ada staff ditemukan</div>
      </div>`;
      return;
    }

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px">` +
      data.map((s, i) => {
        const nomorId = _formatNomorId(s, i);
        return `
        <div class="card">
          <div class="card-body" style="padding:12px">
            <div style="display:flex;justify-content:center;margin-bottom:10px">
              ${_cardFrontHtml(s, nomorId)}
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-primary btn-sm" style="flex:1" onclick="IDCard.showPreview('${s.id}')">
                🪪 Preview Kartu
              </button>
              <button class="btn btn-secondary btn-sm" onclick="IDCard.printCard('${s.id}')">🖨️ Print</button>
            </div>
          </div>
        </div>`;
      }).join('') + `</div>`;
  }

  // ── Preview Modal (depan + belakang) ──────────────────────────────────────
  function showPreview(idStaff) {
    const idx   = staffList.findIndex(s => s.id === idStaff);
    const staff = staffList[idx];
    if (!staff) return;
    const nomorId = _formatNomorId(staff, idx);

    createModal({
      id: 'idcPreviewModal',
      title: 'ID Card — ' + staff.nama,
      body: `
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;padding:8px">
          ${_cardFrontHtml(staff, nomorId)}
          ${_cardBackHtml(staff, nomorId)}
        </div>
        <p style="text-align:center;font-size:11px;color:#888;margin-top:8px">
          Klik Print untuk mencetak kartu identitas karyawan
        </p>`
    });
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  function printCard(idStaff) {
    const idx   = staffList.findIndex(s => s.id === idStaff);
    const staff = staffList[idx];
    if (!staff) return;
    const nomorId = _formatNomorId(staff, idx);

    const win = window.open('', '_blank', 'width=700,height=550');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>ID Card — ${staff.nama}</title>
      <style>
        body { margin: 20px; font-family: Arial, sans-serif; background: #f0f0f0; }
        @media print {
          body { margin: 0; background: white; }
          .no-print { display: none; }
        }
      </style>
    </head><body>
      <div style="display:flex;gap:16px;justify-content:center">
        ${_cardFrontHtml(staff, nomorId)}
        ${_cardBackHtml(staff, nomorId)}
      </div>
      <div class="no-print" style="text-align:center;margin-top:20px">
        <button onclick="window.print()" style="padding:10px 24px;background:#1A3A6B;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer">
          🖨️ Cetak Kartu
        </button>
      </div>
    </body></html>`);
    win.document.close();
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  function filterByCabang() {
    const idCabang = document.getElementById('idcCabang')?.value;
    const query    = document.getElementById('idcSearch')?.value.toLowerCase() || '';
    let filtered   = idCabang ? staffList.filter(s => s.id_cabang === idCabang) : [...staffList];
    if (query) filtered = filtered.filter(s => (s.nama || '').toLowerCase().includes(query));
    renderStaffGrid(filtered);
  }

  // ── Generate All (kept for compatibility) ─────────────────────────────────
  function generateAll() {
    const idCabang = document.getElementById('idcCabang')?.value;
    const filtered = idCabang ? staffList.filter(s => s.id_cabang === idCabang) : [...staffList];
    if (!filtered.length) { toast('Tidak ada staff', 'warning'); return; }
    toast(`Membuka preview untuk ${filtered.length} staff...`, 'info');
    filtered.forEach((s, i) => {
      const nomorId = _formatNomorId(s, staffList.indexOf(s));
      const win = window.open('', `card_${s.id}`, 'width=600,height=500');
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>${s.nama}</title></head><body style="margin:20px;font-family:Arial">
        <div style="display:flex;gap:12px">${_cardFrontHtml(s, nomorId)}${_cardBackHtml(s, nomorId)}</div>
      </body></html>`);
      win.document.close();
    });
  }

  // expose generate/preview aliases
  function generate(idStaff)  { showPreview(idStaff); }
  function preview(idStaff)   { showPreview(idStaff); }

  return { load, generate, preview, showPreview, printCard, filterByCabang, generateAll };
})();
