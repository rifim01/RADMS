/**
 * payroll.js — Modul Payruns & Slip Gaji
 */

const Payruns = (() => {
  let currentPayrollId = null;

  async function load() {
    showLoading(true);
    try {
      const user  = Auth.getUser();
      const idCabang = user.role === 'ADMIN_CABANG' ? user.idCabang : '';
      const tahun = new Date().getFullYear();
      const res   = await API.getPayrollRuns(idCabang, tahun);
      if (!res.success) throw new Error(res.error);
      renderRunList(res.data || []);
      populateCabangSelect('prCabang', false);
      populatePeriodeSelect('prPeriode');
    } catch (e) {
      toast('Gagal memuat payroll: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderRunList(runs) {
    const el = document.getElementById('payrollRunList');
    if (!el) return;
    if (!runs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div>
        <div class="empty-text">Belum ada payroll run</div></div>`;
      return;
    }
    el.innerHTML = `<div class="table-wrapper"><table>
      <thead><tr>
        <th>Periode</th><th>Cabang</th><th>Staff</th>
        <th>Total Gaji</th><th>Status</th><th>Aksi</th>
      </tr></thead><tbody>` +
      runs.map(r => `<tr>
        <td><strong>${formatPeriode(r.periode)}</strong></td>
        <td>${r.id_cabang}</td>
        <td>${r.total_staff} orang</td>
        <td><strong>${formatRp(r.total_gaji_bersih)}</strong></td>
        <td><span class="badge ${r.status === 'FINAL' ? 'badge-green' : 'badge-yellow'}">${r.status}</span></td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline" onclick="Payruns.viewDetail('${r.id}')">Detail</button>
            ${r.status !== 'FINAL' ? `<button class="btn btn-sm btn-success" onclick="Payruns.finalize('${r.id}')">Final</button>` : ''}
            <button class="btn btn-sm btn-yellow" onclick="Payruns.generateAll('${r.id}')">PDF</button>
          </div>
        </td>
      </tr>`).join('') + `</tbody></table></div>`;
  }

  async function generate() {
    const periode  = document.getElementById('prPeriode')?.value;
    const idCabang = document.getElementById('prCabang')?.value;
    if (!periode || !idCabang) { toast('Pilih periode dan cabang', 'warning'); return; }

    if (!confirm(`Generate payroll ${formatPeriode(periode)} untuk cabang ${idCabang}?`)) return;

    showLoading(true);
    try {
      const res = await API.generatePayroll(periode, idCabang);
      if (!res.success) throw new Error(res.error);
      toast(`Payroll ${formatPeriode(periode)} berhasil digenerate — ${res.data.total_staff} staff`, 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function viewDetail(payrollId) {
    currentPayrollId = payrollId;
    showLoading(true);
    try {
      const res = await API.getPayrollDetail(payrollId);
      if (!res.success) throw new Error(res.error);
      renderDetailModal(res.data || [], payrollId);
    } catch (e) {
      toast('Gagal memuat detail: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderDetailModal(details, payrollId) {
    const html = `
      <div class="filter-bar mb-3">
        <div class="search-box">
          <input id="detailSearch" placeholder="Cari nama staff..." oninput="filterTable('detailSearch','detailTable')">
        </div>
      </div>
      <div class="table-wrapper" style="max-height:60vh;overflow-y:auto">
        <table id="detailTable">
          <thead><tr>
            <th>Nama</th><th>Gapok</th><th>Bonus</th><th>Lembur</th>
            <th>Kasbon</th><th>Potongan</th><th>Bersih</th><th>Aksi</th>
          </tr></thead>
          <tbody>${details.map(d => `<tr>
            <td><strong>${d.nama}</strong><br><span class="text-muted" style="font-size:11px">${d.jabatan}</span></td>
            <td>${formatRp(d.gapok)}</td>
            <td>${formatRp(d.bonus_target)}</td>
            <td>${formatRp(d.total_lembur)}</td>
            <td class="text-red">${formatRp(d.kasbon)}</td>
            <td class="text-red">${formatRp(d.total_potongan)}</td>
            <td><strong>${formatRp(d.gaji_bersih)}</strong></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="Payruns.editDetail('${d.id}')">Edit</button>
              <button class="btn btn-sm btn-yellow" onclick="Payruns.slipPDF('${d.id}', '${d.slip_pdf_url}')">
                ${d.slip_pdf_url ? 'Lihat' : 'PDF'}
              </button>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="mt-3 text-right" style="font-size:13px;color:var(--text-muted)">
        Total: <strong>${formatRp(details.reduce((s,d) => s + +d.gaji_bersih, 0))}</strong>
      </div>`;

    createModal({ id: 'detailModal', title: 'Detail Payroll', body: html });
  }

  async function editDetail(id) {
    createModal({
      id: 'editDetailModal',
      title: 'Edit Item Payroll',
      body: `
        <div class="form-group"><label class="form-label">Bonus Target</label>
          <input id="edBonus" class="form-control" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">Kasbon</label>
          <input id="edKasbon" class="form-control" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">Denda Telat</label>
          <input id="edDenda" class="form-control" type="number" placeholder="0"></div>`,
      confirmText: 'Simpan',
      onConfirm: async () => {
        showLoading(true);
        try {
          const res = await API.updatePayrollDetail(id, {
            bonus_target: document.getElementById('edBonus').value,
            kasbon:       document.getElementById('edKasbon').value,
            denda_telat:  document.getElementById('edDenda').value
          });
          if (!res.success) throw new Error(res.error);
          toast('Detail berhasil diupdate', 'success');
          closeModal('editDetailModal');
          viewDetail(currentPayrollId);
        } catch (e) { toast(e.message, 'error'); }
        finally { showLoading(false); }
      }
    });
  }

  async function finalize(id) {
    if (!confirm('Finalize payroll? Setelah final tidak bisa diubah.')) return;
    showLoading(true);
    try {
      const res = await API.finalizePayroll(id);
      if (!res.success) throw new Error(res.error);
      toast('Payroll berhasil difinalkan', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function generateAll(payrollId) {
    if (!confirm('Generate semua slip PDF? Proses mungkin memakan waktu 1-2 menit.')) return;
    showLoading(true);
    try {
      const res = await API.generateAllSlips(payrollId);
      if (!res.success) throw new Error(res.error);
      toast(res.message, 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  async function slipPDF(detailId, existingUrl) {
    if (existingUrl) { window.open(existingUrl, '_blank'); return; }
    showLoading(true);
    try {
      const res = await API.generateSlipPDF(detailId);
      if (!res.success) throw new Error(res.error);
      toast('Slip berhasil digenerate', 'success');
      window.open(res.url, '_blank');
    } catch (e) { toast(e.message, 'error'); }
    finally { showLoading(false); }
  }

  return { load, generate, viewDetail, editDetail, finalize, generateAll, slipPDF };
})();
