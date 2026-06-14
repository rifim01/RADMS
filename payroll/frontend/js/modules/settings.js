/**
 * settings.js — Ganti Password, Info Akun, Integrasi Absensi
 */

const Settings = (() => {
  const LOG_KEY       = 'rifim_sync_log';
  const LAST_SYNC_KEY = 'rifim_last_sync';

  function load() {
    renderUserInfo();
    prefillSyncDates();
    renderSyncLog();
    renderLastSync();
  }

  // ── User Info ───────────────────────────────────────────────────────────────

  function renderUserInfo() {
    const el = document.getElementById('settingsUserInfo');
    if (!el) return;
    const user = Auth.getUser();
    if (!user) return;
    const cabang = APP_CONFIG.CABANG.find(c => c.id === user.idCabang);
    el.innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="min-width:180px">
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Nama</div>
          <div style="font-weight:600;margin-top:2px">${user.nama}</div>
        </div>
        <div style="min-width:180px">
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Email</div>
          <div style="font-weight:600;margin-top:2px">${user.email}</div>
        </div>
        <div style="min-width:180px">
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Role</div>
          <div style="font-weight:600;margin-top:2px">${APP_CONFIG.ROLES[user.role] || user.role}</div>
        </div>
        <div style="min-width:180px">
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Cabang</div>
          <div style="font-weight:600;margin-top:2px">${cabang ? cabang.nama : (user.idCabang || '-')}</div>
        </div>
      </div>`;
  }

  // ── Sync Dates Prefill ──────────────────────────────────────────────────────

  function prefillSyncDates() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const startEl = document.getElementById('setSyncStart');
    const endEl   = document.getElementById('setSyncEnd');
    if (startEl && !startEl.value) startEl.value = `${y}-${m}-01`;
    if (endEl   && !endEl.value)   endEl.value   = now.toISOString().substring(0, 10);
  }

  // ── Ganti Password ──────────────────────────────────────────────────────────

  async function gantiPassword() {
    const oldPw     = document.getElementById('setOldPw')?.value.trim();
    const newPw     = document.getElementById('setNewPw')?.value.trim();
    const confirmPw = document.getElementById('setConfirmPw')?.value.trim();

    if (!oldPw || !newPw || !confirmPw) {
      toast('Semua field password wajib diisi', 'warning'); return;
    }
    if (newPw.length < 8) {
      toast('Password baru minimal 8 karakter', 'warning'); return;
    }
    if (newPw !== confirmPw) {
      toast('Konfirmasi password tidak cocok', 'warning'); return;
    }

    showLoading(true);
    try {
      const res = await API.gantiPassword(oldPw, newPw);
      if (!res.success) throw new Error(res.error);
      toast(res.message || 'Password berhasil diubah. Silakan login ulang.', 'success');
      document.getElementById('setOldPw').value     = '';
      document.getElementById('setNewPw').value     = '';
      document.getElementById('setConfirmPw').value = '';
      setTimeout(() => Auth.logout(), 2000);
    } catch (e) {
      toast('Gagal: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // ── Sync Staff ──────────────────────────────────────────────────────────────

  async function syncStaff() {
    if (!confirm('Sync staff dari MASTER DATA STAFF?\nStaff baru ditambah, yang sudah ada diperbarui.')) return;
    showLoading(true);
    try {
      const res = await API.syncStaffFromMaster();
      if (!res.success) throw new Error(res.error);
      const msg = res.message ||
        `Sync selesai: ${res.added || 0} staff baru, ${res.updated || 0} diperbarui`;
      toast(msg, 'success');
      _addLog('STAFF', msg);
      _saveLastSync('Staff');
      renderLastSync();
    } catch (e) {
      toast('Sync gagal: ' + e.message, 'error');
      _addLog('STAFF', 'GAGAL — ' + e.message);
    } finally {
      showLoading(false);
    }
  }

  // ── Sync Absensi (dengan periode dari input) ────────────────────────────────

  async function syncAbsensi() {
    const start = document.getElementById('setSyncStart')?.value;
    const end   = document.getElementById('setSyncEnd')?.value;
    if (!start || !end) { toast('Pilih periode absensi terlebih dahulu', 'warning'); return; }
    if (!confirm(`Sync absensi dari ERP — periode ${start} s/d ${end}?`)) return;
    await _doSyncAbsensi(start, end);
  }

  // Sync absensi bulan ini tanpa dialog pilih periode
  async function syncAbsensiQuick() {
    const now   = new Date();
    const start = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2,'0') + '-01';
    const end   = now.toISOString().substring(0, 10);
    if (!confirm(`Sync absensi bulan ini (${start} s/d ${end})?`)) return;
    await _doSyncAbsensi(start, end);
  }

  async function _doSyncAbsensi(start, end) {
    showLoading(true);
    try {
      const res = await API.syncAbsensiFromERP(start, end);
      if (!res.success) throw new Error(res.error);
      const msg = res.message ||
        `Sync absensi selesai: ${res.added || 0} record baru, ${res.skipped || 0} dilewati`;
      toast(msg, 'success');
      _addLog('ABSENSI', msg);
      _saveLastSync('Absensi');
      renderLastSync();
      setIntegrationStatus(true);
    } catch (e) {
      toast('Sync gagal: ' + e.message, 'error');
      _addLog('ABSENSI', 'GAGAL — ' + e.message);
      setIntegrationStatus(false, e.message);
    } finally {
      showLoading(false);
    }
  }

  // ── Sync Semua ──────────────────────────────────────────────────────────────

  async function syncSemua() {
    const now   = new Date();
    const start = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2,'0') + '-01';
    const end   = now.toISOString().substring(0, 10);

    if (!confirm(`Sync Semua Data:\n• Staff dari MASTER DATA STAFF\n• Absensi ERP periode ${start} s/d ${end}\n\nLanjutkan?`)) return;

    showLoading(true);
    _addLog('SYNC-ALL', 'Memulai Sync Semua...');
    renderSyncLog();

    try {
      // Step 1 — Staff
      const staffRes = await API.syncStaffFromMaster();
      if (!staffRes.success) throw new Error('Staff: ' + staffRes.error);
      const staffMsg = staffRes.message ||
        `${staffRes.added || 0} staff baru, ${staffRes.updated || 0} diperbarui`;
      _addLog('STAFF', staffMsg);

      // Step 2 — Absensi
      const absRes = await API.syncAbsensiFromERP(start, end);
      if (!absRes.success) throw new Error('Absensi: ' + absRes.error);
      const absMsg = absRes.message ||
        `${absRes.added || 0} record baru, ${absRes.skipped || 0} dilewati`;
      _addLog('ABSENSI', absMsg);

      _addLog('SYNC-ALL', 'Selesai ✓');
      _saveLastSync('Semua');
      renderLastSync();
      setIntegrationStatus(true);
      toast('Sync Semua selesai', 'success');
    } catch (e) {
      toast('Sync Semua gagal: ' + e.message, 'error');
      _addLog('SYNC-ALL', 'GAGAL — ' + e.message);
      setIntegrationStatus(false, e.message);
    } finally {
      showLoading(false);
    }
  }

  // ── Cek Koneksi ─────────────────────────────────────────────────────────────

  async function cekKoneksi() {
    const el = document.getElementById('integrasiStatus');
    if (el) el.innerHTML = '<span style="color:#888">⏳ Mengecek...</span>';
    try {
      const res = await API.getCabang();
      const ok  = res && res.success;
      setIntegrationStatus(ok, ok ? '' : (res?.error || 'no response'));
      _addLog('KONEKSI', ok ? 'OK — GAS API terhubung' : 'GAGAL — ' + (res?.error || 'no response'));
    } catch (e) {
      setIntegrationStatus(false, e.message);
      _addLog('KONEKSI', 'GAGAL — ' + e.message);
    }
  }

  function setIntegrationStatus(ok, reason) {
    const el = document.getElementById('integrasiStatus');
    if (!el) return;
    el.innerHTML = ok
      ? '<span style="color:#27ae60">🟢 Terhubung</span>'
      : `<span style="color:#e74c3c">🔴 Tidak terhubung${reason ? ' — ' + reason : ''}</span>`;
  }

  // ── Sync Log (localStorage) ─────────────────────────────────────────────────

  function _addLog(type, msg) {
    const ts   = new Date().toLocaleString('id-ID', {
      day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit'
    });
    const line = `[${ts}] ${type}: ${msg}`;
    const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    logs.unshift(line);
    if (logs.length > 50) logs.length = 50;
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    renderSyncLog();
  }

  function renderSyncLog() {
    const el = document.getElementById('integrasiLog');
    if (!el) return;
    const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    if (!logs.length) {
      el.innerHTML = '<span style="color:#666">— belum ada aktivitas sync —</span>';
      return;
    }
    el.innerHTML = logs.map(l => {
      const color = l.includes('GAGAL') ? '#e74c3c'
                  : l.includes('Selesai') || l.includes('OK') ? '#2ecc71'
                  : '#a8d8a8';
      return `<div style="color:${color};margin-bottom:2px">${l}</div>`;
    }).join('');
  }

  function _saveLastSync(type) {
    const ts = new Date().toLocaleString('id-ID', {
      day:'2-digit', month:'long', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
    localStorage.setItem(LAST_SYNC_KEY, `${type} — ${ts}`);
  }

  function renderLastSync() {
    const el = document.getElementById('integrasiLastSync');
    if (!el) return;
    const val = localStorage.getItem(LAST_SYNC_KEY);
    el.textContent = val || '—';
  }

  return { load, gantiPassword, syncStaff, syncAbsensi, syncAbsensiQuick, syncSemua, cekKoneksi, setIntegrationStatus };
})();
