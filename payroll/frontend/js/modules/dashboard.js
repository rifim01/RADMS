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
    setWidget('statTotalStaff',    w.totalStaff,   formatRp);
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
    if (!container || !data.length) return;

    const max = Math.max(...data.map(d => d.total || 1), 1);
    container.innerHTML = `<div class="chart-bars">` +
      data.map(d => {
        const pct = Math.round((d.hadir / max) * 100);
        const label = d.tanggal ? d.tanggal.substring(5) : '';
        return `<div class="chart-bar-wrap">
          <div style="flex:1;display:flex;align-items:flex-end">
            <div class="chart-bar red" style="height:${pct}%;width:100%" title="${d.hadir}/${d.total}"></div>
          </div>
          <div class="chart-label">${label}</div>
        </div>`;
      }).join('') + `</div>`;
  }

  function renderGrafikPayroll(data) {
    const container = document.getElementById('chartPayroll');
    if (!container || !data.length) return;

    const max = Math.max(...data.map(d => d.total || 1), 1);
    container.innerHTML = `<div class="chart-bars">` +
      data.map(d => {
        const pct = Math.round((d.total / max) * 100);
        return `<div class="chart-bar-wrap">
          <div style="flex:1;display:flex;align-items:flex-end">
            <div class="chart-bar yellow" style="height:${pct}%;width:100%" title="${formatRp(d.total)}"></div>
          </div>
          <div class="chart-label">${formatPeriode(d.periode)}</div>
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
