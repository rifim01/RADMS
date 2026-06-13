/**
 * attendance.js — Modul Absensi + GPS Validation
 */

const Attendance = (() => {
  async function load() {
    showLoading(true);
    try {
      const user  = Auth.getUser();
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

      // Tampilkan tombol Absen GPS hanya untuk STAFF (atau semua role)
      _renderGpsPanel();
    } catch (e) {
      toast('Gagal memuat absensi: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // ── GPS Panel (self-absen untuk staff) ──────────────────────────────────────
  function _renderGpsPanel() {
    const user  = Auth.getUser();
    const panel = document.getElementById('gpsAbsenPanel');
    if (!panel) return;

    const cabang = APP_CONFIG.CABANG.find(c => c.id === user.idCabang);
    const hasCabang = cabang && cabang.lat;

    panel.innerHTML = `
      <div class="card" style="border-left:4px solid #0284C7">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <div style="font-weight:700;font-size:14px;color:#1e3a5f">📍 Absensi via GPS</div>
              <div style="font-size:12px;color:#666;margin-top:2px" id="gpsStatus">
                ${hasCabang ? `Cabang: <b>${cabang.bandara}</b> (radius ${cabang.radiusM}m)` : 'GPS tidak tersedia untuk cabang ini'}
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="Attendance.absenGPS('Masuk')" ${hasCabang ? '' : 'disabled'}>
                ✅ Absen Masuk
              </button>
              <button class="btn btn-secondary" onclick="Attendance.absenGPS('Pulang')" ${hasCabang ? '' : 'disabled'}>
                🚪 Absen Pulang
              </button>
            </div>
          </div>
          <div id="gpsInfo" style="margin-top:10px;display:none;padding:10px;border-radius:8px;font-size:13px"></div>
        </div>
      </div>`;
  }

  // ── Fungsi utama GPS Absen ─────────────────────────────────────────────────
  async function absenGPS(status) {
    if (!navigator.geolocation) {
      toast('Browser tidak mendukung GPS', 'error'); return;
    }

    const user   = Auth.getUser();
    const cabang = APP_CONFIG.CABANG.find(c => c.id === user.idCabang);
    if (!cabang || !cabang.lat) {
      toast('Koordinat cabang belum dikonfigurasi', 'error'); return;
    }

    const gpsInfo = document.getElementById('gpsInfo');
    if (gpsInfo) {
      gpsInfo.style.display = 'block';
      gpsInfo.style.background = '#EFF6FF';
      gpsInfo.innerHTML = '⏳ Mengambil lokasi GPS... (max 15 detik)';
    }

    let pos;
    try {
      pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
    } catch (err) {
      const msg = err.code === 1 ? 'Izin GPS ditolak. Aktifkan lokasi di browser.' :
                  err.code === 2 ? 'Lokasi tidak tersedia. Pastikan GPS aktif.' :
                                   'GPS timeout. Coba lagi.';
      if (gpsInfo) { gpsInfo.style.background = '#FFF1F2'; gpsInfo.innerHTML = '❌ ' + msg; }
      toast(msg, 'error');
      return;
    }

    const lat    = pos.coords.latitude;
    const lng    = pos.coords.longitude;
    const jarak  = _hitungJarakM(lat, lng, cabang.lat, cabang.lng);
    const dalamArea = jarak <= cabang.radiusM;

    if (gpsInfo) {
      gpsInfo.style.background = dalamArea ? '#F0FDF4' : '#FFFBEB';
      gpsInfo.innerHTML = `
        ${dalamArea ? '✅' : '⚠️'} <b>Jarak dari ${cabang.bandara}:</b> <b style="color:${dalamArea ? '#16a34a' : '#d97706'}">${jarak} meter</b>
        ${dalamArea
          ? '<span style="color:#16a34a"> — Anda berada dalam area kerja</span>'
          : `<span style="color:#d97706"> — Di luar radius ${cabang.radiusM}m. Absen tidak dapat dilakukan.</span>`}
        <br><small style="color:#888">Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>`;
    }

    if (!dalamArea) {
      toast(`Jarak ${jarak}m, di luar radius ${cabang.radiusM}m dari ${cabang.bandara}`, 'warning');
      return;
    }

    // Konfirmasi sebelum submit
    if (!confirm(`Absen ${status} — jarak ${jarak}m dari ${cabang.bandara}. Lanjutkan?`)) return;

    showLoading(true);
    try {
      const res = await API.addAbsensi({
        id_staff:  user.id,
        nama:      user.nama,
        id_cabang: user.idCabang,
        status:    status,
        lat:       lat,
        lng:       lng,
        method:    'gps'
      });
      if (!res.success) throw new Error(res.error);
      toast(`Absen ${status} berhasil! Jarak: ${jarak}m dari bandara`, 'success');
      if (gpsInfo) gpsInfo.style.display = 'none';
      load();
    } catch (e) {
      toast('Gagal absen: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // ── Haversine (frontend) ───────────────────────────────────────────────────
  function _hitungJarakM(lat1, lng1, lat2, lng2) {
    const R   = 6371000;
    const d2r = Math.PI / 180;
    const dLat = (lat2 - lat1) * d2r;
    const dLng = (lng2 - lng1) * d2r;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLng/2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // ── Summary ────────────────────────────────────────────────────────────────
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
        <td><span class="badge ${s.masuk  ? 'badge-green' : 'badge-red'}">${s.masuk  ? 'Hadir' : 'Alpha'}</span></td>
        <td><span class="badge ${s.pulang ? 'badge-green' : 'badge-gray'}">${s.pulang ? 'Sudah' : 'Belum'}</span></td>
      </tr>`).join('');
  }

  // ── Log Absensi ────────────────────────────────────────────────────────────
  function renderList(data) {
    const el = document.getElementById('absListBody');
    if (!el) return;
    if (!data.length) {
      el.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <div class="empty-icon">📋</div><div class="empty-text">Tidak ada data absensi</div>
      </div></td></tr>`;
      return;
    }
    el.innerHTML = data.map(a => {
      const jarakBadge = a.jarak_meter
        ? `<span style="font-size:11px;color:#0284C7">📍${a.jarak_meter}m</span>`
        : '';
      const methodBadge = a.method === 'gps'
        ? `<span class="badge badge-blue">GPS</span>`
        : `<span class="badge badge-gray">${a.method || 'manual'}</span>`;
      return `<tr>
        <td>${formatTanggal(a.tanggal)}</td>
        <td>${a.nama}</td>
        <td>${a.id_cabang}</td>
        <td><span class="badge ${a.status === 'Masuk' ? 'badge-green' : 'badge-blue'}">${a.status}</span></td>
        <td>${methodBadge} ${jarakBadge}</td>
        <td>${a.timestamp ? String(a.timestamp).substring(11, 16) : '-'}</td>
      </tr>`;
    }).join('');
  }

  // ── Search / Filter ────────────────────────────────────────────────────────
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

  // ── Bulk Hadir ─────────────────────────────────────────────────────────────
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

  // ── Form Manual (Admin) ───────────────────────────────────────────────────
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

  return { load, search, bulkHadir, showAddForm, absenGPS };
})();
