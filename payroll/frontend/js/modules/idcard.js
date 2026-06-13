/**
 * idcard.js — Modul ID Card Generator
 */

const IDCard = (() => {
  let staffList = [];

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

  function renderStaffGrid(data) {
    const el = document.getElementById('idcGrid');
    if (!el) return;

    if (!data.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🪪</div><div class="empty-text">Tidak ada staff ditemukan</div>
      </div>`;
      return;
    }

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">` +
      data.map(s => `
        <div class="card">
          <div class="card-body">
            <div class="id-card-preview">
              <div class="card-logo">RIFIM</div>
              <div class="card-company">PT RIFIM GEMILANG</div>
              <div class="card-nama">${s.nama}</div>
              <div class="card-jabatan">${s.jabatan || 'Staff'}</div>
              <div class="card-id">ID: ${s.id.substring(0, 8).toUpperCase()}</div>
              <div class="card-strip">KARTU IDENTITAS KARYAWAN · ${s.id_cabang}</div>
            </div>
            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-primary btn-sm" style="flex:1" onclick="IDCard.generate('${s.id}')">
                Generate PDF
              </button>
              <button class="btn btn-secondary btn-sm" onclick="IDCard.preview('${s.id}')">Preview</button>
            </div>
          </div>
        </div>`).join('') + `</div>`;
  }

  async function generate(idStaff) {
    showLoading(true);
    try {
      const res = await API.generateIDCard(idStaff);
      if (!res.success) throw new Error(res.error);
      toast('ID Card berhasil digenerate!', 'success');
      window.open(res.url, '_blank');
    } catch (e) {
      toast('Gagal: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function preview(idStaff) {
    const staff = staffList.find(s => s.id === idStaff);
    if (!staff) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(staff.id)}`;
    createModal({
      id: 'idcPreviewModal',
      title: 'Preview ID Card — ' + staff.nama,
      body: `
        <div style="display:flex;justify-content:center;padding:16px">
          <div class="id-card-preview" style="position:relative">
            <div class="card-logo">RIFIM</div>
            <div class="card-company">PT RIFIM GEMILANG</div>
            <img src="${qrUrl}" style="position:absolute;right:12px;top:12px;background:white;padding:4px;border-radius:4px">
            <div class="card-nama" style="margin-top:12px">${staff.nama}</div>
            <div class="card-jabatan">${staff.jabatan || 'Staff'}</div>
            <div class="card-id">ID: ${staff.id.substring(0, 8).toUpperCase()}</div>
            <div class="card-strip">KARTU IDENTITAS KARYAWAN · ${staff.id_cabang}</div>
          </div>
        </div>
        <p class="text-center text-muted mt-2" style="font-size:12px">
          QR Code berisi ID staff untuk scan verifikasi
        </p>`
    });
  }

  function filterByCabang() {
    const idCabang = document.getElementById('idcCabang')?.value;
    const filtered = idCabang ? staffList.filter(s => s.id_cabang === idCabang) : staffList;
    renderStaffGrid(filtered);
  }

  async function generateAll() {
    const idCabang = document.getElementById('idcCabang')?.value;
    const filtered = idCabang ? staffList.filter(s => s.id_cabang === idCabang) : staffList;
    if (!filtered.length) { toast('Tidak ada staff', 'warning'); return; }
    if (!confirm(`Generate ${filtered.length} ID Card? Proses mungkin membutuhkan waktu.`)) return;

    showLoading(true);
    let success = 0;
    for (const s of filtered) {
      try {
        await API.generateIDCard(s.id);
        success++;
      } catch (e) { /* lanjut ke berikutnya */ }
    }
    showLoading(false);
    toast(`${success}/${filtered.length} ID Card berhasil digenerate`, 'success');
  }

  return { load, generate, preview, filterByCabang, generateAll };
})();
