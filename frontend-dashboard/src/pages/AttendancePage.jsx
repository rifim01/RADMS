import { useState, useEffect, useCallback, useRef } from 'react'
import {
  UserCheck, UserX, Clock, RefreshCw, Download, FileText,
  Printer, Calendar, ChevronDown, AlertCircle, RotateCcw, Save, BarChart2,
} from 'lucide-react'
import { AIRPORT_BRANCHES, SHIFT_WINDOWS } from '../services/airportConfig'
import { fetchAttendanceData, processAttendanceRecords, getLast7DaysData, determineAttendanceStatus } from '../services/attendanceService'
import { MOCK_ATTENDANCE_DATA } from '../services/mockData'
import { useAuth } from '../context/AuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatRp(amount) {
  if (!amount) return '-'
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getMonthName(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { month: 'long' })
}

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------
function AttBadge({ status }) {
  const cfg = {
    'Hadir':       'bg-green-100 text-green-700 border-green-300',
    'Terlambat':   'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Khusus':      'bg-orange-100 text-orange-700 border-orange-300',
    'Tidak Hadir': 'bg-red-100 text-red-700 border-red-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Stats card component
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    green:  { bg: 'bg-green-50',  border: 'border-l-green-500',  icon: 'text-green-500',  val: 'text-green-700' },
    yellow: { bg: 'bg-yellow-50', border: 'border-l-yellow-500', icon: 'text-yellow-500', val: 'text-yellow-700' },
    orange: { bg: 'bg-orange-50', border: 'border-l-orange-500', icon: 'text-orange-500', val: 'text-orange-700' },
    red:    { bg: 'bg-red-50',    border: 'border-l-red-500',    icon: 'text-red-500',    val: 'text-red-700' },
    sky:    { bg: 'bg-sky-50',    border: 'border-l-sky-500',    icon: 'text-sky-500',    val: 'text-sky-700' },
  }
  const c = colors[color] ?? colors.sky
  return (
    <div className={`${c.bg} ${c.border} border-l-4 rounded-lg p-4 flex items-center gap-3 shadow-sm`}>
      <Icon className={`${c.icon} w-7 h-7 flex-shrink-0`} />
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm modal
// ---------------------------------------------------------------------------
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-gray-800 font-semibold text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">Batal</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-semibold">Ya, Reset</button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mini bar chart
// ---------------------------------------------------------------------------
function MiniBarChart({ data, labels }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
          <div
            className="w-full rounded-t bg-sky-400 transition-all"
            style={{ height: `${(v / max) * 52}px`, minHeight: v > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AttendancePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [demoMode, setDemoMode]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Tab-2 state
  const [branch7, setBranch7]       = useState('')
  const [startDate7, setStartDate7] = useState(getNDaysAgo(6))
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Tab-4 state
  const [filterBranchRekap, setFilterBranchRekap] = useState('')
  const [filterDateFrom, setFilterDateFrom]       = useState(getNDaysAgo(29))
  const [filterDateTo, setFilterDateTo]           = useState(getToday())
  const [filterStatus, setFilterStatus]           = useState('')
  const [confirmReset, setConfirmReset]           = useState(false)

  const autoRefreshRef = useRef(null)
  const tab3RefreshRef = useRef(null)

  // Clock
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  const filterByBranch = useCallback((processed) => {
    if (!user || user.role === 'super_admin') return processed
    if (!user.airportId) return processed  // no branch info → show all
    return processed.filter(r => r.idCabang === user.airportId)
  }, [user?.role, user?.airportId])

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const raw = await fetchAttendanceData()
      const processed = processAttendanceRecords(raw)
      setRecords(filterByBranch(processed))
      setDemoMode(false)
      setLastUpdated(new Date())
    } catch (err) {
      console.warn('Google Sheets fetch failed, using demo data:', err.message)
      const processed = processAttendanceRecords(MOCK_ATTENDANCE_DATA)
      setRecords(filterByBranch(processed))
      setDemoMode(true)
      setLastUpdated(new Date())
      if (!silent) setError(`Tidak dapat mengakses Google Sheets (${err.message}). Menampilkan data demo.`)
    } finally {
      setLoading(false)
    }
  }, [filterByBranch])

  useEffect(() => {
    loadData()
    // Auto-refresh every 60s on Tab 1
    const t = setInterval(() => loadData(true), 60000)
    return () => clearInterval(t)
  }, [loadData])

  // Tab-3 auto refresh every 2 minutes
  useEffect(() => {
    if (activeTab === 2) {
      tab3RefreshRef.current = setInterval(() => loadData(true), 120000)
    }
    return () => clearInterval(tab3RefreshRef.current)
  }, [activeTab, loadData])

  // Tab-2 auto refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => loadData(true), 60000)
    } else {
      clearInterval(autoRefreshRef.current)
    }
    return () => clearInterval(autoRefreshRef.current)
  }, [autoRefresh, loadData])

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const todayStr = getToday()

  const todayRecords = records.filter(r => r.date === todayStr)
  const countHadir     = todayRecords.filter(r => r.status === 'Hadir').length
  const countTerlambat = todayRecords.filter(r => r.status === 'Terlambat').length
  const countKhusus    = todayRecords.filter(r => r.status === 'Khusus').length
  const countBelum     = todayRecords.filter(r => r.status === 'Tidak Hadir').length

  // Tab-2: filter records by branch and date range
  const records7 = branch7
    ? getLast7DaysData(records, branch7).filter(r => r.date >= startDate7)
    : []

  // Group by nama for Tab-2 summary
  const summary7 = (() => {
    const map = {}
    for (const r of records7) {
      if (!map[r.nama]) map[r.nama] = { nama: r.nama, hadir: 0, terlambat: 0, khusus: 0, deduction: 0 }
      if (r.status === 'Hadir') map[r.nama].hadir++
      else if (r.status === 'Terlambat') { map[r.nama].terlambat++; map[r.nama].deduction += (r.deduction || 0) }
      else if (r.status === 'Khusus') map[r.nama].khusus++
    }
    return Object.values(map)
  })()

  const branchConfig = AIRPORT_BRANCHES[branch7]
  const isExemptBranch = branchConfig?.deductionExempt ?? false

  // Tab-3: weekly summary per branch
  const weeklySummary = (() => {
    const cutoff = getNDaysAgo(6)
    const filtered = records.filter(r => r.date >= cutoff)
    const map = {}
    for (const r of filtered) {
      const key = r.idCabang
      if (!map[key]) map[key] = { cabang: key, hadir: 0, terlambat: 0, khusus: 0, tidakHadir: 0, total: 0 }
      map[key].total++
      if (r.status === 'Hadir') map[key].hadir++
      else if (r.status === 'Terlambat') map[key].terlambat++
      else if (r.status === 'Khusus') map[key].khusus++
      else map[key].tidakHadir++
    }
    return Object.values(map)
  })()

  // Tab-3 trend chart: hadir per day (last 7 days)
  const trendData = (() => {
    const labels = []
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }))
      data.push(records.filter(r => r.date === ds && r.status === 'Hadir').length)
    }
    return { labels, data }
  })()

  // Tab-4: rekap filtered
  const rekapRecords = records.filter(r => {
    const matchBranch = !filterBranchRekap || r.idCabang === filterBranchRekap
    const matchDateFrom = !filterDateFrom || r.date >= filterDateFrom
    const matchDateTo = !filterDateTo || r.date <= filterDateTo
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchBranch && matchDateFrom && matchDateTo && matchStatus
  })

  // ---------------------------------------------------------------------------
  // Export CSV
  // ---------------------------------------------------------------------------
  function exportCSV() {
    const header = ['Nama', 'Cabang', 'Tanggal', 'Bulan', 'Shift', 'Jam Masuk', 'Jam Pulang', 'Status', 'Menit Terlambat', 'Potongan']
    const rows = rekapRecords.map(r => [
      r.nama, r.idCabang, r.date, getMonthName(r.date), r.shift,
      r.masuk ?? '-', r.pulang ?? '-', r.status, r.minutesLate ?? 0, r.deduction ?? 0
    ])
    const csv = [header, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `rekap-absensi-${getToday()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() { window.print() }

  function handleReset() { setConfirmReset(true) }
  function doReset() {
    setRecords([])
    setConfirmReset(false)
  }

  // ---------------------------------------------------------------------------
  // Tabs config
  // ---------------------------------------------------------------------------
  const tabs = ['Hari Ini', '7 Hari', 'Mingguan', 'Rekap']

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5 fade-in">
      <ConfirmModal
        open={confirmReset}
        message="Reset semua data tampilan? (Data di Google Sheets tidak terpengaruh)"
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/rifim-logo.svg" alt="RIFIM" className="h-9" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sistem Absensi</h1>
            <p className="text-gray-500 text-sm">Pantau kehadiran staf operasional secara realtime</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {demoMode && (
            <span className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs font-semibold px-3 py-1 rounded-full">
              Demo Mode
            </span>
          )}
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-sky-600">
              {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-gray-400">
              {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 no-print"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2 text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error} Pastikan Google Sheet bersifat publik (Bagikan → Siapa saja yang memiliki tautan).</span>
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-gray-400 -mt-2">
          Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')} · Auto-refresh setiap 60 detik
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 no-print">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === i
                ? 'bg-sky-500 text-white shadow'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1 — Hari Ini                                                */}
      {/* ================================================================ */}
      {activeTab === 0 && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={UserCheck} label="Hadir"       value={countHadir}     color="green"  />
            <StatCard icon={Clock}     label="Terlambat"   value={countTerlambat} color="yellow" />
            <StatCard icon={Calendar}  label="Khusus"      value={countKhusus}    color="orange" />
            <StatCard icon={UserX}     label="Belum Absen" value={countBelum}     color="red"    />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Absensi Hari Ini — {formatDisplayDate(todayStr)}</h3>
            </div>
            {loading ? (
              <div className="py-16 text-center text-gray-400 animate-pulse">Memuat data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-50 text-sky-700 text-xs font-semibold uppercase tracking-wide">
                    <tr>
                      {['Nama', 'Cabang', 'Shift', 'Jam Masuk', 'Jam Pulang', 'Status', 'Potongan'].map(h => (
                        <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {todayRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                          Belum ada data absensi hari ini
                        </td>
                      </tr>
                    ) : (
                      todayRecords.map((r, i) => (
                        <tr key={i} className="hover:bg-sky-50/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{r.nama}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{r.idCabang}</td>
                          <td className="px-4 py-3 text-gray-600">{r.shift ?? '-'}</td>
                          <td className="px-4 py-3 font-mono text-emerald-600 font-medium">{r.masuk ?? '—'}</td>
                          <td className="px-4 py-3 font-mono text-blue-600">{r.pulang ?? <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3"><AttBadge status={r.status} /></td>
                          <td className="px-4 py-3 text-red-500 font-medium">{formatRp(r.deduction)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2 — 7 Hari                                                  */}
      {/* ================================================================ */}
      {activeTab === 1 && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end no-print">
            {/* Branch selector */}
            {user?.role === 'super_admin' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Cabang</label>
              <div className="relative">
                <select
                  value={branch7}
                  onChange={e => setBranch7(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white min-w-[220px]"
                >
                  <option value="">— Pilih Cabang —</option>
                  {Object.keys(AIRPORT_BRANCHES).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cabang</label>
              <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium min-w-[220px]">{user?.airportId}</span>
            </div>
            )}

            {/* Date from */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate7}
                onChange={e => setStartDate7(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <button
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors self-end"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={() => setAutoRefresh(a => !a)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors self-end border ${
                autoRefresh
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin text-green-500' : ''}`} />
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </button>

            {lastUpdated && (
              <span className="text-xs text-gray-400 self-end pb-2">
                Update: {lastUpdated.toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>

          {/* Data or empty state */}
          {!branch7 ? (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-12 text-center">
              <Calendar className="w-12 h-12 text-sky-300 mx-auto mb-3" />
              <p className="text-sky-600 font-semibold text-lg">Pilih ID Cabang untuk melihat data absensi</p>
              <p className="text-sky-400 text-sm mt-1">Gunakan dropdown di atas untuk memilih cabang</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">
                  Rekap 7 Hari — <span className="text-sky-600">{branch7}</span>
                </h3>
                {isExemptBranch && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                    Bebas Potongan
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-50 text-sky-700 text-xs font-semibold uppercase tracking-wide">
                    <tr>
                      {['Nama', 'Tanggal', 'Bulan', 'Hadir', 'Terlambat', 'Potongan'].map(h => (
                        <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records7.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                          Tidak ada data untuk cabang dan rentang tanggal ini
                        </td>
                      </tr>
                    ) : (
                      records7.map((r, i) => (
                        <tr key={i} className="hover:bg-sky-50/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{r.nama}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDisplayDate(r.date)}</td>
                          <td className="px-4 py-3 text-gray-500">{getMonthName(r.date)}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">
                            {r.status === 'Hadir' ? '✓' : '-'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-yellow-600">
                            {r.status === 'Terlambat' ? `${r.minutesLate ?? 0} mnt` : '-'}
                          </td>
                          <td className="px-4 py-3 text-red-500 font-medium">
                            {isExemptBranch ? '-' : formatRp(r.deduction)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Summary footer */}
              {summary7.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-4">
                  {summary7.map(s => (
                    <span key={s.nama}>
                      <b className="text-gray-700">{s.nama}:</b>{' '}
                      <span className="text-green-600">{s.hadir} hadir</span>,{' '}
                      <span className="text-yellow-600">{s.terlambat} terlambat</span>
                      {!isExemptBranch && s.deduction > 0 && (
                        <>, <span className="text-red-500">potongan {formatRp(s.deduction)}</span></>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3 — Mingguan                                                */}
      {/* ================================================================ */}
      {activeTab === 2 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-500">Ringkasan minggu ini (7 hari terakhir) · Auto-refresh 2 menit</p>
            <button onClick={() => loadData()} className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium no-print">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-sky-500" />
              <h3 className="font-semibold text-gray-800">Tren Kehadiran 7 Hari</h3>
            </div>
            <MiniBarChart data={trendData.data} labels={trendData.labels} />
          </div>

          {/* Per-branch table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Ringkasan Per Cabang</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-50 text-sky-700 text-xs font-semibold uppercase tracking-wide">
                  <tr>
                    {['Cabang', 'Total Hadir', 'Terlambat', 'Khusus', 'Tidak Hadir', '% Kehadiran'].map(h => (
                      <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {weeklySummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">Tidak ada data minggu ini</td>
                    </tr>
                  ) : (
                    weeklySummary.map((row, i) => {
                      const pct = row.total > 0 ? Math.round(((row.hadir + row.terlambat) / row.total) * 100) : 0
                      return (
                        <tr key={i} className="hover:bg-sky-50/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{row.cabang}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">{row.hadir}</td>
                          <td className="px-4 py-3 font-semibold text-yellow-600">{row.terlambat}</td>
                          <td className="px-4 py-3 font-semibold text-orange-500">{row.khusus}</td>
                          <td className="px-4 py-3 font-semibold text-red-500">{row.tidakHadir}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
                                <div
                                  className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4 — Rekap                                                   */}
      {/* ================================================================ */}
      {activeTab === 3 && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end no-print">
            {/* Branch */}
            {user?.role === 'super_admin' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cabang</label>
              <div className="relative">
                <select
                  value={filterBranchRekap}
                  onChange={e => setFilterBranchRekap(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white min-w-[200px]"
                >
                  <option value="">Semua Cabang</option>
                  {Object.keys(AIRPORT_BRANCHES).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cabang</label>
              <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium min-w-[200px]">{user?.airportId}</span>
            </div>
            )}

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dari</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hingga</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                <option value="">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Khusus">Khusus</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 no-print">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Buat PDF
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset Data
            </button>
            <button onClick={() => {}}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Save className="w-4 h-4" /> Simpan Filter
            </button>
          </div>

          {/* Print header - only shows when printing */}
          <div className="print-only hidden">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">RIFIM — Rekap Absensi</h2>
              <p className="text-sm text-gray-500">Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {filterBranchRekap && <p className="text-sm">Cabang: {filterBranchRekap}</p>}
              <p className="text-sm">Periode: {formatDisplayDate(filterDateFrom)} — {formatDisplayDate(filterDateTo)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Detail Rekap ({rekapRecords.length} catatan)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-50 text-sky-700 text-xs font-semibold uppercase tracking-wide">
                  <tr>
                    {['Nama', 'Cabang', 'Tanggal', 'Shift', 'Jam Masuk', 'Jam Pulang', 'Status', 'Menit Terlambat', 'Potongan'].map(h => (
                      <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rekapRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        Tidak ada data untuk filter ini
                      </td>
                    </tr>
                  ) : (
                    rekapRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-sky-50/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{r.nama}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{r.idCabang}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDisplayDate(r.date)}</td>
                        <td className="px-4 py-3 text-gray-600">{r.shift ?? '-'}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600">{r.masuk ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-blue-600">{r.pulang ?? '—'}</td>
                        <td className="px-4 py-3"><AttBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-gray-600">{r.minutesLate ? `${r.minutesLate} mnt` : '-'}</td>
                        <td className="px-4 py-3 text-red-500 font-medium">{formatRp(r.deduction)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
