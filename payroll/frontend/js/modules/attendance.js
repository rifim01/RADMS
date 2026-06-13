/**
 * attendance.js — Modul Absensi
 */

const Attendance = (() => {
  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const today = new Date().toISOString().substring(0, 10);
      const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';

      const [summaryRes, listRes] = await Promise.all([
        API.getSummaryAbsensi(idCabang, today),
        API.getAbsensi({ idCabang, startDate: today, endDate: today })
      ]);

      if (summaryRes.success) renderSummary(summaryRes);
      if (listRes.success)    renderList(listRes.data || []);

      populateCabangSelect('absCabang', true);
      document.getElementById('absDate').value = today;
    } catch (e) {
      toast('Gagal memuat absensi: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderSummary(s) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('absStatTotal',  s.totalStaff);
    set('absStatHadir',  s.hadir);
    set('absStatAlpha',  s.alpha);
    set('absStatPulang', s.pulang);
    renderStatusTable(s.detail || []);
  }

  function renderStatusTable(detail) {
    const el = document.getElementById('absStatusTable');
    if (!el) return;
    el.innerHTML = detail.map(s => `
      <tr>
        <td>${s.nama}</td>
        <td>${s.jabatan || '-'}</td>
        <td><span class="badge ${s.masuk ? 'badge-green' : 'badge-red'}">${s.masuk ? 'Hadir' : 'Alpha'}</span></td>
        <td><span class="badge ${s.pulang ? 'badge-green' : 'badge-gray'}">${s.pulang ? 'Sudah' : 'Belum'}</span></td>
      </tr>`).join('');
  }

  function renderList(data) {
    const el = document.getElementById('absListBody');
    if (!el) return;
    if (!data.length) {
      el.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        <div class="empty-icon">📋</div><div class="empty-text">Tidak ada data absensi</div>
      </div></td></tr>`;
      return;
    }
    el.innerHTML = data.map(a => `<tr>
      <td>${formatTanggal(a.tanggal)}</td>
      <td>${a.nama}</td>
      <td>${a.id_cabang}</td>
      <td><span class="badge ${a.status === 'Masuk' ? 'badge-green' : 'badge-blue'}">${a.status}</span></td>
      <td>${a.method || 'manual'}</td>
      <td>${a.timestamp ? a.timestamp.substring(11, 16) : '-'}</td>
    </tr>`).join('');
  }

  async function search() {
    const idCabang  = document.getElementById('absCabang')?.value;
    const startDate = document.getElementById('absDate')?.value;
    showLoading(true);
    try {
      const res = await API.getAbsensi({ idCabang, startDate, endDate: startDate });
      if (!res.success) throw new Error(res.error);
      renderList(res.data || []);
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function bulkHadir() {
    const idCabang = document.getElementById('absCabang')?.value;
    const tanggal  = document.getElementById('absDate')?.value;
    if (!idCabang) { toast('Pilih cabang terlebih dahulu', 'warning'); return; }
    if (!confirm(`Tandai semua staff hadir pada ${formatTanggal(tanggal)} untuk cabang ${idCabang}?`)) return;

    showLoading(true);
    try {
      const res = await API.bulkHadir(idCabang, tanggal);
      if (!res.success) throw new Error(res.error);
      toast(res.message, 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  function showAddForm() {
    createModal({
      id: 'addAbsensiModal',
      title: 'Tambah Absensi Manual',
      body: `
        <div class="form-group"><label class="form-label">Cabang</label>
          <select id="aasCabang" class="form-control"></select></div>
        <div class="form-group"><label class="form-label">Nama Staff</label>
          <input id="aasNama" class="form-control" placeholder="Nama lengkap"></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select id="aasStatus" class="form-control">
            <option value="Masuk">Masuk</option>
            <option value="Pulang">Pulang</option>
          </select></div>`,
      confirmText: 'Simpan',
      onConfirm: saveAbsensi
    });
    populateCabangSelect('aasCabang', false);
  }

  async function saveAbsensi() {
    const data = {
      id_cabang: document.getElementById('aasCabang')?.value,
      nama:      document.getElementById('aasNama')?.value,
      status:    document.getElementById('aasStatus')?.value,
      id_staff:  'manual-' + Date.now()
    };
    if (!data.nama || !data.id_cabang) { toast('Isi semua field', 'warning'); return; }
    showLoading(true);
    try {
      const res = await API.addAbsensi(data);
      if (!res.success) throw new Error(res.error);
      toast('Absensi berhasil ditambahkan', 'success');
      closeModal('addAbsensiModal');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  return { load, search, bulkHadir, showAddForm };
})();
