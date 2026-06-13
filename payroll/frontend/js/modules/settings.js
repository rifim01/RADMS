/**
 * settings.js — Ganti Password & Sinkronisasi Data
 */

const Settings = (() => {

  function load() {
    renderUserInfo();
    prefillSyncDates();
  }

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

  function prefillSyncDates() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const startEl = document.getElementById('setSyncStart');
    const endEl   = document.getElementById('setSyncEnd');
    if (startEl && !startEl.value) startEl.value = `${y}-${m}-01`;
    if (endEl   && !endEl.value)   endEl.value   = now.toISOString().substring(0, 10);
  }

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

  async function syncStaff() {
    if (!confirm('Sync staff dari MASTER DATA STAFF? Staff baru akan ditambah, duplikat dilewati.')) return;
    showLoading(true);
    try {
      const res = await API.syncStaffFromMaster();
      if (!res.success) throw new Error(res.error);
      toast(`Sync selesai: ${res.added} staff baru ditambah, ${res.skipped} dilewati`, 'success');
    } catch (e) {
      toast('Sync gagal: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function syncAbsensi() {
    const start = document.getElementById('setSyncStart')?.value;
    const end   = document.getElementById('setSyncEnd')?.value;
    if (!start || !end) { toast('Pilih periode absensi terlebih dahulu', 'warning'); return; }
    if (!confirm(`Sync absensi dari ${start} s/d ${end}?`)) return;

    showLoading(true);
    try {
      const res = await API.syncAbsensiFromERP(start, end);
      if (!res.success) throw new Error(res.error);
      toast(`Sync selesai: ${res.added} record baru ditambah, ${res.skipped} duplikat dilewati`, 'success');
    } catch (e) {
      toast('Sync gagal: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  return { load, gantiPassword, syncStaff, syncAbsensi };
})();
