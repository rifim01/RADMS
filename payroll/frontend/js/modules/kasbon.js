/**
 * kasbon.js — Modul Kasbon / Advance Payment
 */

const Kasbon = (() => {
  let staffList    = [];
  let _allKasbon   = [];
  let _page        = 1;
  const PAGE_SIZE  = 50;

  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : (document.getElementById('ksbCabang')?.value || '');

      // Satu API call untuk semua data (staff + kasbon)
      const [staffRes, kasbonRes] = await Promise.all([
        API.getStaff(idCabang),
        API.getAllKasbon(idCabang)
      ]);

      staffList = staffRes.success ? (staffRes.data || []) : [];
      const staffMap = {};
      staffList.forEach(s => { staffMap[s.id] = s.nama; });

      _allKasbon = kasbonRes.success
        ? (kasbonRes.data || []).map(k => ({ ...k, _nama: staffMap[k.id_staff] || k.nama || '-' }))
        : [];
      _page = 1;

      renderTable(_allKasbon.slice(0, PAGE_SIZE));
      populateCabangSelect('ksbCabang', true);
    } catch (e) {
      toast('Gagal memuat data kasbon: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderTable(data) {
    const el = document.getElementById('kasbonTableBody');
    if (!el) return;

    if (!data.length) {
      el.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <div class="empty-icon">💸</div>
        <div class="empty-text">Tidak ada data kasbon</div>
      </div></td></tr>`;
      _renderLoadMore();
      return;
    }

    // Sort by tanggal desc (already sorted from getAllKasbon, but ensure)
    data.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));

    el.innerHTML = data.map(k => `<tr>
      <td>${formatTanggal(k.tanggal)}</td>
      <td><strong>${k.nama || k._nama || '-'}</strong></td>
      <td>${k.id_cabang}</td>
      <td class="font-bold text-red">${formatRp(k.jumlah)}</td>
      <td>${k.keterangan || '-'}</td>
      <td>${k.periode_potong ? formatPeriode(k.periode_potong) : '-'}</td>
      <td><span class="badge ${k.status === 'LUNAS' ? 'badge-green' : 'badge-yellow'}">${k.status}</span></td>
    </tr>`).join('');

    _renderLoadMore();
  }

  function _renderLoadMore() {
    const container = document.getElementById('kasbonLoadMore');
    if (!container) return;
    const shown = Math.min(_page * PAGE_SIZE, _allKasbon.length);
    const total  = _allKasbon.length;
    if (shown >= total) {
      container.innerHTML = total
        ? `<div style="text-align:center;font-size:12px;color:#888;padding:8px">Menampilkan semua ${total} record</div>`
        : '';
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:12px">
          <span style="font-size:12px;color:#888">Menampilkan ${shown} dari ${total} record</span>
          <button class="btn btn-outline btn-sm" style="margin-left:12px" onclick="Kasbon.loadMore()">
            Muat ${Math.min(PAGE_SIZE, total - shown)} data lagi ▼
          </button>
        </div>`;
    }
  }

  function loadMore() {
    _page++;
    const sliced = _allKasbon.slice(0, _page * PAGE_SIZE);
    renderTable(sliced);
  }

  function showForm() {
    const staffOptions = staffList.map(s =>
      `<option value="${s.id}" data-gapok="${s.gapok}" data-cabang="${s.id_cabang}">${s.nama}</option>`
    ).join('');

    createModal({
      id: 'kasbonModal',
      title: 'Input Kasbon',
      body: `
        <div class="form-group">
          <label class="form-label">Staff *</label>
          <select id="ksbStaff" class="form-control" onchange="Kasbon.onStaffChange()">
            <option value="">Pilih Staff</option>${staffOptions}
          </select>
        </div>
        <div id="ksbGapoкInfo" style="display:none;padding:8px;background:#fef9c3;border-radius:6px;font-size:13px;margin-bottom:12px">
          Gaji Pokok: <strong id="ksbGapokVal">-</strong> · Maks kasbon = gaji pokok
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Jumlah Kasbon *</label>
            <input id="ksbJumlah" class="form-control" type="number" placeholder="0" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Periode Potong</label>
            <select id="ksbPeriode" class="form-control">
              <option value="">Pilih Bulan Potong</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Keterangan</label>
          <input id="ksbKet" class="form-control" placeholder="Keperluan kasbon...">
        </div>`,
      confirmText: 'Simpan Kasbon',
      onConfirm: saveKasbon
    });

    populatePeriodeSelect('ksbPeriode');
  }

  function onStaffChange() {
    const sel   = document.getElementById('ksbStaff');
    const opt   = sel?.options[sel?.selectedIndex];
    const gapok = opt?.dataset?.gapok;
    const info  = document.getElementById('ksbGapoкInfo');
    const val   = document.getElementById('ksbGapokVal');
    if (gapok && info && val) {
      info.style.display = 'block';
      val.textContent = formatRp(gapok);
    }
  }

  async function saveKasbon() {
    const sel = document.getElementById('ksbStaff');
    const opt = sel?.options[sel?.selectedIndex];

    const data = {
      id_staff:       sel?.value,
      id_cabang:      opt?.dataset?.cabang,
      jumlah:         document.getElementById('ksbJumlah')?.value,
      periode_potong: document.getElementById('ksbPeriode')?.value,
      keterangan:     document.getElementById('ksbKet')?.value
    };

    if (!data.id_staff || !data.jumlah) {
      toast('Pilih staff dan isi jumlah kasbon', 'warning'); return;
    }

    const gapok = Number(opt?.dataset?.gapok || 0);
    if (Number(data.jumlah) > gapok && gapok > 0) {
      toast(`Kasbon tidak boleh melebihi gaji pokok (${formatRp(gapok)})`, 'warning'); return;
    }

    showLoading(true);
    try {
      const res = await API.addKasbon(data);
      if (!res.success) throw new Error(res.error);
      toast('Kasbon berhasil disimpan', 'success');
      closeModal('kasbonModal');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  return { load, showForm, onStaffChange, loadMore };
})();
