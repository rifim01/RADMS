/**
 * dashboard.js — Modul halaman Dashboard
 */

const Dashboard = (() => {
  let data = null;

  async function load() {
    showLoading(true);
    try {
      const user = Auth.getUser();
      const idCabang = (user.role === 'ADMIN_CABANG') ? user.idCabang : '';
      const today = new Date().toISOString().substring(0, 10);

      const res = await API.getDashboard(idCabang, today);
      if (!res.success) throw new Error(res.error);
      data = res;
      render(data);
    } catch (e) {
      toast('Gagal memuat dashboard: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function render(d) {
    const w = d.widgets;
    setWidget('statTotalStaff',    w.totalStaff);
    setWidget('statHadir',         w.hadirHariIni);
    setWidget('statAlpha',         w.alphaHariIni);
    setWidget('statCuti',          w.cutiHariIni);
    setWidget('statPayroll',       w.totalPayrollBulanIni, formatRp);

    renderGrafikKehadiran(d.grafikKehadiran || []);
    renderGrafikPayroll(d.grafikPayroll || []);
    renderTabelCabang(d.cabangList || []);
  }

  function setWidget(id, val, fmt) {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt ? fmt(val) : (val || 0);
  }

  function renderGrafikKehadiran(data) {
    const container = document.getElementById('chartKehadiran');
    if (!container) return;

    const allZero = data.every(d => !d.hadir);
    if (!data.length || allZero) {
      container.innerHTML = `<div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px">
        <div style="text-align:center"><div style="font-size:28px;margin-bottom:8px">📋</div>Belum ada data absensi</div></div>`;
      return;
    }

    const max = Math.max(...data.map(d => d.total || 1), 1);
    container.innerHTML = `<div class="chart-bars">` +
      data.map(d => {
        const pct = Math.max(4, Math.round((d.hadir / max) * 100));
        const label = d.tanggal ? d.tanggal.substring(5) : '';
        return `<div class="chart-bar-wrap">
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;text-align:center">${d.hadir}</div>
          <div style="flex:1;display:flex;align-items:flex-end">
            <div class="chart-bar red" style="height:${pct}%;width:100%" title="Hadir: ${d.hadir}/${d.total}"></div>
          </div>
          <div class="chart-label">${label}</div>
        </div>`;
      }).join('') + `</div>`;
  }

  function renderGrafikPayroll(data) {
    const container = document.getElementById('chartPayroll');
    if (!container) return;

    const allZero = data.every(d => !d.total);
    if (!data.length || allZero) {
      container.innerHTML = `<div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px">
        <div style="text-align:center"><div style="font-size:28px;margin-bottom:8px">💰</div>Belum ada data payroll</div></div>`;
      return;
    }

    const max = Math.max(...data.map(d => d.total || 1), 1);
    container.innerHTML = `<div class="chart-bars">` +
      data.map(d => {
        const pct = Math.max(4, Math.round((d.total / max) * 100));
        const shortLabel = d.periode ? d.periode.substring(2, 7).replace('-', '/') : '';
        return `<div class="chart-bar-wrap">
          <div style="flex:1;display:flex;align-items:flex-end">
            <div class="chart-bar yellow" style="height:${pct}%;width:100%" title="${formatRp(d.total)}"></div>
          </div>
          <div class="chart-label">${shortLabel}</div>
        </div>`;
      }).join('') + `</div>`;
  }

  function renderTabelCabang(list) {
    const el = document.getElementById('tabelCabang');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<p class="text-muted text-center mt-3">Tidak ada data</p>'; return; }
    el.innerHTML = `<div class="table-wrapper"><table>
      <thead><tr>
        <th>Cabang</th><th>Total Staff</th><th>Hadir</th><th>Alpha</th><th>%</th>
      </tr></thead><tbody>` +
      list.map(c => {
        const pct = c.totalStaff ? Math.round((c.hadir / c.totalStaff) * 100) : 0;
        return `<tr>
          <td><strong>${c.nama}</strong></td>
          <td>${c.totalStaff}</td>
          <td><span class="badge badge-green">${c.hadir}</span></td>
          <td><span class="badge badge-red">${c.totalStaff - c.hadir}</span></td>
          <td>${pct}%</td>
        </tr>`;
      }).join('') + `</tbody></table></div>`;
  }

  return { load };
})();
