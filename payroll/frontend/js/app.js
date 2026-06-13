/**
 * app.js — Router, nav, clock, toast, shared UI
 */

// ── Live Clock ────────────────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  const update = () => {
    const now = new Date();
    el.textContent = now.toLocaleString('id-ID', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  update();
  setInterval(update, 1000);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── Loading ───────────────────────────────────────────────────────────────────
function showLoading(show = true) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function createModal({ id, title, body, onConfirm, confirmText = 'Simpan', confirmClass = 'btn-primary' }) {
  let modal = document.getElementById(id);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-overlay hidden';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal('${id}')">✕</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('${id}')">Batal</button>
        ${onConfirm ? `<button class="btn ${confirmClass}" id="${id}ConfirmBtn">${confirmText}</button>` : ''}
      </div>
    </div>`;
  modal.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(id);
  });
  if (onConfirm) {
    document.getElementById(`${id}ConfirmBtn`).onclick = onConfirm;
  }
  openModal(id);
}

// ── Format Helpers ────────────────────────────────────────────────────────────
function formatRp(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function formatTanggal(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPeriode(p) {
  if (!p) return '-';
  const [y, m] = p.split('-');
  const bulan = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${bulan[+m]} ${y}`;
}

function namaInitial(nama) {
  return (nama || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Populate Select ───────────────────────────────────────────────────────────
function populateCabangSelect(selectId, addAll = false) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cabang = APP_CONFIG.CABANG;
  sel.innerHTML = (addAll ? '<option value="">Semua Cabang</option>' : '<option value="">Pilih Cabang</option>') +
    cabang.map(c => `<option value="${c.id}">${c.nama}</option>`).join('');

  const user = Auth.getUser();
  if (user && user.role === 'ADMIN_CABANG') {
    sel.value = user.idCabang;
    sel.disabled = true;
  }
}

function populatePeriodeSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const now = new Date();
  let options = '';
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.toISOString().substring(0, 7);
    options += `<option value="${val}">${formatPeriode(val)}</option>`;
  }
  sel.innerHTML = options;
}

// ── Navigation ────────────────────────────────────────────────────────────────
const PAGE_MODULES = {
  dashboard:  () => Dashboard.load(),
  staff:      () => Staff.load(),
  attendance: () => Attendance.load(),
  payroll:    () => Payroll.load(),
  payruns:    () => Payruns.load(),
  leave:      () => Leave.load(),
  idcard:     () => IDCard.load(),
  report:     () => Report.load()
};

function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));

  const section = document.getElementById('page-' + page);
  if (section) section.classList.add('active');

  document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));

  const titles = {
    dashboard:  'Dashboard',
    staff:      'Manajemen Staff',
    attendance: 'Absensi',
    payroll:    'Payroll',
    payruns:    'Payruns',
    leave:      'Cuti & Izin',
    idcard:     'ID Card Generator',
    report:     'Laporan'
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[page] || page;

  if (PAGE_MODULES[page]) {
    try { PAGE_MODULES[page](); } catch (e) { console.error('Page load error:', e); }
  }

  // Close sidebar on mobile
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');

  window.location.hash = page;
}

// ── Sidebar Toggle ────────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

// ── Search helper ─────────────────────────────────────────────────────────────
function filterTable(inputId, tableId) {
  const query = document.getElementById(inputId)?.value.toLowerCase() || '';
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;

  startClock();

  const user = Auth.getUser();
  if (user) {
    const el = document.getElementById('userInfo');
    if (el) el.innerHTML = `
      <div class="user-avatar">${namaInitial(user.nama)}</div>
      <div><div class="user-name">${user.nama}</div>
      <div class="user-role">${APP_CONFIG.ROLES[user.role] || user.role}</div></div>`;

    const badge = document.getElementById('roleBadge');
    if (badge) badge.textContent = APP_CONFIG.ROLES[user.role] || user.role;
  }

  document.getElementById('btnLogout')?.addEventListener('click', Auth.logout);
  document.getElementById('btnMenuToggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', toggleSidebar);

  // Route berdasarkan hash
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(hash);

  // Sembunyikan menu yang tidak sesuai role
  const role = user?.role;
  if (role === 'STAFF') {
    document.querySelectorAll('[data-role-min="ADMIN_CABANG"]').forEach(el => el.style.display = 'none');
  }
  if (role !== 'OWNER' && role !== 'SUPER_ADMIN') {
    document.querySelectorAll('[data-role-min="SUPER_ADMIN"]').forEach(el => el.style.display = 'none');
  }
});
