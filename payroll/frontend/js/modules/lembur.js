/**
 * lembur.js — Modul Lembur Management
 */

const Lembur = (() => {
  let staffList = [];

  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';
      const periodeNow = new Date().toISOString().substring(0, 7);

      const [lemburRes, staffRes] = await Promise.all([
        API.getLembur(idCabang, periodeNow),
        API.getStaff(idCabang)
      ]);

      staffList = staffRes.success ? (staffRes.data || []) : [];
      if (lemburRes.success) renderTable(lemburRes.data || []);

      populateCabangSelect('lbrCabang', true);
      populatePeriodeSelect('lbrPeriode');
    } catch (e) {
      toast('Gagal memuat data lembur: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderTable(data) {
    const el = document.getElementById('lemburTableBody');
    if (!el) return;

    if (!data.length) {
      el.innerHTML = `<tr><td colspan="9"><div class="empty-state">
        <div class="empty-icon">⏰</div>
        <div class="empty-text">Belum ada data lembur</div>
        <div class="empty-sub">Klik "Tambah Lembur" untuk input data</div>
      </div></td></tr>`;
      return;
    }

    el.innerHTML = data.map(l => `<tr>
      <td>${formatTanggal(l.tanggal)}</td>
      <td><strong>${l.nama}</strong><br><span class="text-muted" style="font-size:11px">${l.id_cabang}</span></td>
      <td>${l.jam_masuk} – ${l.jam_keluar}</td>
      <td class="font-bold">${Number(l.jam_lembur || 0).toFixed(1)} jam</td>
      <td>${formatRp(l.tarif_lembur)}/jam</td>
      <td class="font-bold text-green">${formatRp(l.total_lembur)}</td>
      <td>${l.keterangan || '-'}</td>
      <td><span class="badge ${
        l.status === 'APPROVED' ? 'badge-green' :
        l.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'
      }">${l.status}</span></td>
      <td>
        ${l.status === 'PENDING' ? `
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-success" onclick="Lembur.approve('${l.id}')">✓ Setuju</button>
            <button class="btn btn-sm btn-danger" onclick="Lembur.reject('${l.id}')">✗ Tolak</button>
          </div>` : '-'}
      </td>
    </tr>`).join('');
  }

  async function filter() {
    const idCabang = document.getElementById('lbrCabang')?.value;
    const periode  = document.getElementById('lbrPeriode')?.value;
    showLoading(true);
    try {
      const res = await API.getLembur(idCabang, periode);
      if (!res.success) throw new Error(res.error);
      renderTable(res.data || []);
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  function showForm() {
    const staffOptions = staffList.map(s =>
      `<option value="${s.id}" data-gapok="${s.gapok}" data-cabang="${s.id_cabang}">${s.nama} — ${s.jabatan || ''}</option>`
    ).join('');

    createModal({
      id: 'lemburModal',
      title: 'Input Data Lembur',
      body: `
        <div class="form-group">
          <label class="form-label">Staff *</label>
          <select id="lbrStaff" class="form-control" onchange="Lembur.onStaffChange()">${staffOptions}</select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Tanggal *</label>
            <input id="lbrTanggal" class="form-control" type="date" value="${new Date().toISOString().substring(0,10)}">
          </div>
          <div class="form-group">
            <label class="form-label">Gaji Pokok</label>
            <input id="lbrGapok" class="form-control" type="number" readonly>
          </div>
          <div class="form-group">
            <label class="form-label">Jam Masuk *</label>
            <input id="lbrJamMasuk" class="form-control" type="time" value="08:00" oninput="Lembur.hitungPreview()">
          </div>
          <div class="form-group">
            <label class="form-label">Jam Keluar *</label>
            <input id="lbrJamKeluar" class="form-control" type="time" value="18:00" oninput="Lembur.hitungPreview()">
          </div>
        </div>
        <div id="lemburPreview" class="card" style="background:#f0fff4;border-color:#86efac;padding:12px;margin-top:4px">
          <div class="d-flex gap-3" style="flex-wrap:wrap">
            <div><span class="text-muted">Jam Lembur:</span> <strong id="prvJamLembur">-</strong></div>
            <div><span class="text-muted">Tarif/jam:</span> <strong id="prvTarif">-</strong></div>
            <div><span class="text-muted">Total Lembur:</span> <strong id="prvTotal" class="text-green">-</strong></div>
          </div>
        </div>
        <div class="form-group mt-3">
          <label class="form-label">Keterangan</label>
          <input id="lbrKet" class="form-control" placeholder="Pekerjaan apa...">
        </div>`,
      confirmText: 'Simpan Lembur',
      onConfirm: saveLembur
    });

    // Set default gapok dari staff pertama
    setTimeout(() => Lembur.onStaffChange(), 100);
  }

  function onStaffChange() {
    const sel   = document.getElementById('lbrStaff');
    const opt   = sel?.options[sel.selectedIndex];
    const gapok = opt?.dataset?.gapok || 0;
    const el    = document.getElementById('lbrGapok');
    if (el) el.value = gapok;
    hitungPreview();
  }

  function tarifGolongan(gapok) {
    const g = Number(gapok);
    if (g <= 2600000) return 11500;
    if (g <= 2850000) return 13000;
    return 14500;
  }

  function hitungPreview() {
    const gapok    = Number(document.getElementById('lbrGapok')?.value || 0);
    const jamMasuk = document.getElementById('lbrJamMasuk')?.value || '08:00';
    const jamKeluar= document.getElementById('lbrJamKeluar')?.value || '17:00';

    const toMin  = t => { const [h, m] = t.split(':'); return +h * 60 + +m; };
    const durasi = toMin(jamKeluar) - toMin(jamMasuk);
    const lembur = Math.max(0, durasi - 9 * 60);
    const jamLbr = lembur / 60;
    const tarif  = tarifGolongan(gapok);
    const total  = jamLbr * tarif;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('prvJamLembur', jamLbr.toFixed(2) + ' jam');
    set('prvTarif', formatRp(Math.round(tarif)) + '/jam');
    set('prvTotal', formatRp(Math.round(total)));

    const preview = document.getElementById('lemburPreview');
    if (preview) preview.style.background = lembur > 12 * 60 ? '#fff0f0' : '#f0fff4';
  }

  async function saveLembur() {
    const sel = document.getElementById('lbrStaff');
    const opt = sel?.options[sel?.selectedIndex];

    const data = {
      id_staff:   sel?.value,
      nama:       opt?.text?.split('—')[0]?.trim(),
      id_cabang:  opt?.dataset?.cabang,
      gapok:      document.getElementById('lbrGapok')?.value,
      tanggal:    document.getElementById('lbrTanggal')?.value,
      jam_masuk:  document.getElementById('lbrJamMasuk')?.value,
      jam_keluar: document.getElementById('lbrJamKeluar')?.value,
      keterangan: document.getElementById('lbrKet')?.value
    };

    if (!data.id_staff || !data.tanggal || !data.jam_keluar) {
      toast('Pilih staff dan isi waktu lembur', 'warning'); return;
    }

    showLoading(true);
    try {
      const res = await API.addLembur(data);
      if (!res.success) throw new Error(res.error);
      toast('Lembur berhasil disimpan', 'success');
      closeModal('lemburModal');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function approve(id) {
    showLoading(true);
    try {
      const res = await API.approveLembur(id);
      if (!res.success) throw new Error(res.error);
      toast('Lembur disetujui', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function reject(id) {
    showLoading(true);
    try {
      const res = await API.rejectLembur(id);
      if (!res.success) throw new Error(res.error);
      toast('Lembur ditolak', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  return { load, filter, showForm, onStaffChange, hitungPreview, approve, reject };
})();
