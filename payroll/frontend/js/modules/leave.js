/**
 * leave.js — Modul Cuti & Izin
 */

const Leave = (() => {
  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';
      const res = await API.getCuti(idCabang, '');
      if (!res.success) throw new Error(res.error);
      renderList(res.data || []);
      populateCabangSelect('cutiCabang', true);
    } catch (e) {
      toast('Gagal memuat data cuti: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderList(data) {
    const el = document.getElementById('cutiTableBody');
    if (!el) return;
    if (!data.length) {
      el.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <div class="empty-icon">🏖️</div><div class="empty-text">Tidak ada data cuti</div>
      </div></td></tr>`;
      return;
    }
    el.innerHTML = data.map(c => `<tr>
      <td>${c.nama}</td>
      <td><span class="badge badge-blue">${c.jenis_cuti}</span></td>
      <td>${formatTanggal(c.tanggal_mulai)}</td>
      <td>${formatTanggal(c.tanggal_selesai)}</td>
      <td>${c.jumlah_hari} hari</td>
      <td>${c.keterangan || '-'}</td>
      <td><span class="badge ${c.status === 'APPROVED' ? 'badge-green' : c.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}">${c.status}</span></td>
      <td>
        ${c.status === 'PENDING' ? `
          <button class="btn btn-sm btn-success" onclick="Leave.approve('${c.id}')">✓</button>
          <button class="btn btn-sm btn-danger" onclick="Leave.reject('${c.id}')">✗</button>
        ` : '-'}
      </td>
    </tr>`).join('');
  }

  async function filter() {
    const idCabang = document.getElementById('cutiCabang')?.value;
    const status   = document.getElementById('cutiStatus')?.value;
    showLoading(true);
    try {
      const res = await API.getCuti(idCabang, status);
      if (!res.success) throw new Error(res.error);
      renderList(res.data || []);
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  function showForm() {
    createModal({
      id: 'cutiModal',
      title: 'Ajukan Cuti / Izin',
      body: `
        <div class="form-group"><label class="form-label">Nama Staff *</label>
          <input id="ctNama" class="form-control" placeholder="Nama lengkap"></div>
        <div class="form-group"><label class="form-label">Cabang *</label>
          <select id="ctCabang" class="form-control"></select></div>
        <div class="form-group"><label class="form-label">Jenis Cuti *</label>
          <select id="ctJenis" class="form-control">
            <option value="TAHUNAN">Cuti Tahunan (max 3x)</option>
            <option value="SAKIT">Sakit (max 2 hari)</option>
            <option value="MENIKAH">Menikah (7 hari)</option>
            <option value="HAMIL">Hamil (3 bulan)</option>
            <option value="IZIN">Izin</option>
          </select></div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Tanggal Mulai *</label>
            <input id="ctMulai" class="form-control" type="date"></div>
          <div class="form-group"><label class="form-label">Tanggal Selesai *</label>
            <input id="ctSelesai" class="form-control" type="date"></div>
        </div>
        <div class="form-group"><label class="form-label">Keterangan</label>
          <textarea id="ctKet" class="form-control"></textarea></div>`,
      confirmText: 'Ajukan Cuti',
      onConfirm: saveCuti
    });
    populateCabangSelect('ctCabang', false);
  }

  async function saveCuti() {
    const data = {
      nama:            document.getElementById('ctNama')?.value?.trim(),
      id_cabang:       document.getElementById('ctCabang')?.value,
      jenis_cuti:      document.getElementById('ctJenis')?.value,
      tanggal_mulai:   document.getElementById('ctMulai')?.value,
      tanggal_selesai: document.getElementById('ctSelesai')?.value,
      keterangan:      document.getElementById('ctKet')?.value,
      id_staff:        'staff-' + Date.now()
    };
    if (!data.nama || !data.id_cabang || !data.tanggal_mulai || !data.tanggal_selesai) {
      toast('Isi semua field yang wajib', 'warning'); return;
    }
    showLoading(true);
    try {
      const res = await API.ajukanCuti(data);
      if (!res.success) throw new Error(res.error);
      toast('Permohonan cuti berhasil diajukan', 'success');
      closeModal('cutiModal');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function approve(id) {
    showLoading(true);
    try {
      const res = await API.approveCuti(id);
      if (!res.success) throw new Error(res.error);
      toast('Cuti disetujui', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function reject(id) {
    const alasan = prompt('Alasan penolakan:');
    if (alasan === null) return;
    showLoading(true);
    try {
      const res = await API.rejectCuti(id, alasan);
      if (!res.success) throw new Error(res.error);
      toast('Cuti ditolak', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  return { load, filter, showForm, approve, reject };
})();
