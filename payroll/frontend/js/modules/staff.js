/**
 * staff.js — Modul Manajemen Staff
 */

const Staff = (() => {
  let list = [];

  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const idCabang = (user.role === 'ADMIN_CABANG') ? user.idCabang : '';
      const res = await API.getStaff(idCabang);
      if (!res.success) throw new Error(res.error);
      list = res.data || [];
      renderTable(list);
      document.getElementById('statStaffCount').textContent = list.length;
    } catch (e) {
      toast('Gagal memuat data staff: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderTable(data) {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-text">Belum ada data staff</div>
        <div class="empty-sub">Klik "Tambah Staff" untuk menambahkan</div>
      </div></td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr>
        <td>
          <div class="d-flex align-center gap-2">
            <div class="user-avatar" style="width:32px;height:32px;font-size:12px">${namaInitial(s.nama)}</div>
            <div><strong>${s.nama}</strong><br><span class="text-muted" style="font-size:11px">${s.email}</span></div>
          </div>
        </td>
        <td>${s.jabatan || '-'}</td>
        <td><span class="badge badge-blue" style="font-size:10px">${s.id_cabang}</span></td>
        <td>${formatRp(s.gapok)}</td>
        <td>${s.nomor_hp || '-'}</td>
        <td><span class="badge ${s.status === 'AKTIF' ? 'badge-green' : 'badge-red'}">${s.status}</span></td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline" onclick="Staff.edit('${s.id}')">Edit</button>
            <button class="btn btn-sm btn-secondary" onclick="Staff.generateCard('${s.id}')">ID Card</button>
            <button class="btn btn-sm btn-danger" onclick="Staff.hapus('${s.id}', '${s.nama}')">Hapus</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function showForm(staff = null) {
    const isEdit = !!staff;
    const html = `
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Nama Lengkap *</label>
          <input id="sfNama" class="form-control" value="${staff?.nama || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input id="sfEmail" class="form-control" type="email" value="${staff?.email || ''}" ${isEdit ? 'disabled' : ''}>
        </div>
        <div class="form-group">
          <label class="form-label">Jabatan</label>
          <input id="sfJabatan" class="form-control" value="${staff?.jabatan || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">No. HP</label>
          <input id="sfHP" class="form-control" type="tel" value="${staff?.nomor_hp || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Gaji Pokok *</label>
          <input id="sfGapok" class="form-control" type="number" value="${staff?.gapok || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Cabang *</label>
          <select id="sfCabang" class="form-control"></select>
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select id="sfRole" class="form-control">
            <option value="STAFF">Staff</option>
            <option value="ADMIN_CABANG">Admin Cabang</option>
            <option value="SUPER_ADMIN" ${Auth.hasRole('OWNER') ? '' : 'disabled'}>Super Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="sfStatus" class="form-control">
            <option value="AKTIF">Aktif</option>
            <option value="NONAKTIF">Nonaktif</option>
          </select>
        </div>
        ${!isEdit ? `<div class="form-group"><label class="form-label">Password</label>
          <input id="sfPassword" class="form-control" type="password" placeholder="Kosongkan = auto-generate">
        </div>` : ''}
      </div>`;

    createModal({
      id: 'staffModal',
      title: isEdit ? 'Edit Staff' : 'Tambah Staff',
      body: html,
      confirmText: isEdit ? 'Simpan Perubahan' : 'Tambah Staff',
      onConfirm: () => saveStaff(staff?.id)
    });

    populateCabangSelect('sfCabang');
    if (staff) {
      document.getElementById('sfCabang').value  = staff.id_cabang;
      document.getElementById('sfRole').value    = staff.role;
      document.getElementById('sfStatus').value  = staff.status;
    }
  }

  async function saveStaff(id = null) {
    const data = {
      nama:      document.getElementById('sfNama')?.value?.trim(),
      email:     document.getElementById('sfEmail')?.value?.trim(),
      jabatan:   document.getElementById('sfJabatan')?.value?.trim(),
      nomor_hp:  document.getElementById('sfHP')?.value?.trim(),
      gapok:     document.getElementById('sfGapok')?.value,
      id_cabang: document.getElementById('sfCabang')?.value,
      role:      document.getElementById('sfRole')?.value,
      status:    document.getElementById('sfStatus')?.value,
      password:  document.getElementById('sfPassword')?.value
    };

    if (!data.nama || !data.email || !data.gapok || !data.id_cabang) {
      toast('Isi semua field yang wajib diisi', 'warning'); return;
    }

    showLoading(true);
    try {
      const res = id ? await API.updateStaff(id, data) : await API.addStaff(data);
      if (!res.success) throw new Error(res.error);
      toast(id ? 'Staff berhasil diupdate' : `Staff ditambahkan${res.tempPassword ? '. Password: ' + res.tempPassword : ''}`, 'success');
      closeModal('staffModal');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function edit(id) {
    const res = await API.getStaffById(id);
    if (res.success) showForm(res.data);
    else toast('Gagal memuat data staff', 'error');
  }

  async function hapus(id, nama) {
    if (!confirm(`Hapus staff "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    showLoading(true);
    try {
      const res = await API.deleteStaff(id);
      if (!res.success) throw new Error(res.error);
      toast('Staff berhasil dihapus', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function generateCard(id) {
    showLoading(true);
    try {
      const res = await API.generateIDCard(id);
      if (!res.success) throw new Error(res.error);
      toast('ID Card berhasil digenerate!', 'success');
      window.open(res.url, '_blank');
    } catch (e) {
      toast('Gagal generate ID Card: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  return { load, showForm, edit, hapus, generateCard };
})();
