import { useState, useEffect, useRef } from 'react'
import { PhoneCall, CheckCircle, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { listenQueueByBranch, updateQueueStatus, removeFromQueue as removeFromQueueDb } from '../services/realtimeService'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { AIRPORTS } from '../services/mockData'
import { AIRPORT_BRANCHES } from '../services/airportConfig'
import { useAuth } from '../context/AuthContext'
import { formatTime } from '../utils/formatters'
import { playCalled, playNotification, unlockAudio } from '../services/soundService'
import { logJadwalKerja } from '../services/jadwalKerjaService'

// Exclude internal/admin-only entries from queue branch selector
const BRANCH_KEYS = Object.keys(AIRPORT_BRANCHES).filter(k => !AIRPORT_BRANCHES[k].admin)

export default function QueueManagementPage() {
  const { user } = useAuth()
  const [branchId, setBranchId] = useState(
    user.role === 'super_admin' ? (BRANCH_KEYS[0] || 'all') : (user.airportId || BRANCH_KEYS[0] || 'all')
  )
  const [queue, setQueue] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [showResetModal, setShowResetModal] = useState(false)
  const prevQueueLen = useRef(0)

  // Listen Firebase RTDB — play sound when new driver joins
  useEffect(() => {
    if (!branchId || branchId === 'all') {
      setQueue([])
      return
    }
    const unsub = listenQueueByBranch(branchId, entries => {
      // Play sound when queue grows (new driver joins)
      if (entries.length > prevQueueLen.current) {
        playNotification()
      }
      prevQueueLen.current = entries.length
      setQueue(entries)
    })
    return unsub
  }, [branchId])

  // Unlock audio on first interaction
  useEffect(() => { unlockAudio() }, [])

  const filtered = queue.filter(q => {
    const matchStatus = filterStatus === 'all' || q.status === filterStatus
    return matchStatus
  })

  function updateStatus(driverId, newStatus) {
    if (!branchId || branchId === 'all') return
    if (newStatus === 'CALLED') {
      playCalled()
      logJadwalKerja({ ...user, airportId: user.airportId || branchId })
    }
    updateQueueStatus(branchId, driverId, newStatus)
  }

  function removeFromQueue(driverId) {
    if (!branchId || branchId === 'all') return
    logJadwalKerja({ ...user, airportId: user.airportId || branchId })
    removeFromQueueDb(branchId, driverId)
  }

  function handleReset() {
    // Reset all entries in current branch back to WAITING
    queue.forEach(q => {
      if (q.driverId && branchId && branchId !== 'all') {
        updateQueueStatus(branchId, q.driverId, 'WAITING')
      }
    })
    setShowResetModal(false)
  }

  const counts = {
    WAITING:   filtered.filter(q => q.status === 'WAITING').length,
    CALLED:    filtered.filter(q => q.status === 'CALLED').length,
    PICKUP:    filtered.filter(q => q.status === 'PICKUP').length,
    COMPLETED: filtered.filter(q => q.status === 'COMPLETED').length,
  }

  return (
    <div className="space-y-6 fade-in">

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#0f4c8a] to-[#0ea5e9] p-5 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src="/rifim-logo.svg" alt="RIFIM" className="h-10 bg-white rounded-lg px-2 py-1" />
            <div>
              <h1 className="text-xl font-bold text-white">Manajemen Antrian</h1>
              <p className="text-sky-200 text-sm mt-0.5">RIFIM Driver Queue System — FIFO</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-yellow-400/30 text-yellow-200 px-2 py-0.5 rounded-full">{counts.WAITING} Menunggu</span>
                <span className="text-xs bg-blue-400/30 text-blue-200 px-2 py-0.5 rounded-full">{counts.CALLED} Dipanggil</span>
                <span className="text-xs bg-green-400/30 text-green-200 px-2 py-0.5 rounded-full">{counts.PICKUP} Jemput</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white text-sm rounded-lg transition font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Reset Antrian
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { status: 'WAITING',   label: 'Menunggu',     color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { status: 'CALLED',    label: 'Dipanggil',    color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { status: 'PICKUP',    label: 'Penjemputan',  color: 'bg-green-50 border-green-200 text-green-700' },
          { status: 'COMPLETED', label: 'Selesai',      color: 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map(s => (
          <div key={s.status} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-sm font-medium opacity-80">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{counts[s.status]}</p>
          </div>
        ))}
      </div>

      {/* Cara kerja antrian */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">Cara Kerja Antrian</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-blue-700">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center flex-shrink-0">1</span>
            <span>Driver masuk antrian via App Driver (tombol "Masuk Antrian")</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center flex-shrink-0">2</span>
            <span>Staff klik <strong>📞 Panggil</strong> saat ada penumpang datang (urutan FIFO)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center flex-shrink-0">3</span>
            <span>Driver mendapat notifikasi & konfirmasi → status <strong>Penjemputan</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center flex-shrink-0">4</span>
            <span>Klik ✓ setelah selesai jemput → driver kembali ke antrian belakang</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        {user.role === 'super_admin' ? (
          <select value={branchId} onChange={e => setBranchId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {BRANCH_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        ) : (
          <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
            {branchId}
          </span>
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Semua Status</option>
          <option value="WAITING">Menunggu</option>
          <option value="CALLED">Dipanggil</option>
          <option value="PICKUP">Penjemputan</option>
          <option value="COMPLETED">Selesai</option>
        </select>
        <div className="ml-auto text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-800">{filtered.length}</span> antrian
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['No.', 'Nama Driver', 'Plat', 'Titik Jemput', 'Status', 'Masuk', 'Dipanggil', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Tidak ada data antrian</td></tr>
              ) : filtered.map((q, idx) => {
                return (
                  <tr key={q.driverId || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{q.driverName}</p>
                      <p className="text-xs text-gray-400">{q.branchId}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{q.plateNumber}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{q.pickupPoint || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatTime(q.joinedAt)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{q.calledAt ? formatTime(q.calledAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {q.status === 'WAITING' && (
                          <button onClick={() => updateStatus(q.driverId, 'CALLED')} title="Panggil Driver"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'CALLED' && (
                          <button onClick={() => updateStatus(q.driverId, 'PICKUP')} title="Konfirmasi Penjemputan"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'PICKUP' && (
                          <button onClick={() => updateStatus(q.driverId, 'COMPLETED')} title="Selesai"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {['WAITING', 'CALLED'].includes(q.status) && (
                          <button onClick={() => removeFromQueue(q.driverId)} title="Hapus dari Antrian"
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {['COMPLETED', 'REMOVED'].includes(q.status) && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Konfirmasi Reset Antrian" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Peringatan!</p>
              <p className="text-sm text-red-700 mt-1">
                Ini akan mereset semua status antrian driver menjadi <strong>Menunggu</strong>.
                Semua status Dipanggil dan Penjemputan akan dikembalikan ke awal.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Total <strong>{filtered.length}</strong> data antrian akan direset. Lanjutkan?</p>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setShowResetModal(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              Batal
            </button>
            <button onClick={handleReset}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">
              Ya, Reset Sekarang
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
