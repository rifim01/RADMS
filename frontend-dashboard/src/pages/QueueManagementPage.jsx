import { useState } from 'react'
import { PhoneCall, CheckCircle, Trash2, Filter, RefreshCw } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { QUEUE_DATA, AIRPORTS } from '../services/mockData'
import { useAuth } from '../context/AuthContext'
import { formatDateTime, formatTime } from '../utils/formatters'

export default function QueueManagementPage() {
  const { user } = useAuth()
  const [queue, setQueue] = useState(QUEUE_DATA)
  const [filterAirport, setFilterAirport] = useState(user.airportId || 'all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = queue.filter(q => {
    const matchAirport = filterAirport === 'all' || q.airportId === filterAirport
    const matchStatus = filterStatus === 'all' || q.status === filterStatus
    return matchAirport && matchStatus
  })

  function updateStatus(id, newStatus) {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, calledAt: newStatus === 'CALLED' ? new Date().toISOString() : q.calledAt } : q))
  }

  function removeFromQueue(id) {
    if (window.confirm('Apakah Anda yakin ingin menghapus driver ini dari antrian?')) {
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'REMOVED' } : q))
    }
  }

  const statusCounts = {
    WAITING: filtered.filter(q => q.status === 'WAITING').length,
    CALLED: filtered.filter(q => q.status === 'CALLED').length,
    PICKUP: filtered.filter(q => q.status === 'PICKUP').length,
    COMPLETED: filtered.filter(q => q.status === 'COMPLETED').length,
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Antrian</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola antrian driver di titik penjemputan</p>
        </div>
        <button
          onClick={() => setQueue(QUEUE_DATA)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" /> Reset Antrian
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { status: 'WAITING', label: 'Menunggu', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { status: 'CALLED', label: 'Dipanggil', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { status: 'PICKUP', label: 'Penjemputan', color: 'bg-green-50 border-green-200 text-green-700' },
          { status: 'COMPLETED', label: 'Selesai', color: 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map(s => (
          <div key={s.status} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-sm font-medium opacity-80">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{statusCounts[s.status]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        {user.role === 'super_admin' && (
          <select
            value={filterAirport}
            onChange={e => setFilterAirport(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Bandara</option>
            {AIRPORTS.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
            ))}
          </select>
        )}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="WAITING">Menunggu</option>
          <option value="CALLED">Dipanggil</option>
          <option value="PICKUP">Penjemputan</option>
          <option value="COMPLETED">Selesai</option>
        </select>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          Total: <span className="font-semibold text-gray-800 ml-1">{filtered.length}</span> antrian
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['No. Antrian', 'Nama Driver', 'Plat', 'Titik Jemput', 'Status', 'Masuk Antrian', 'Dipanggil', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Tidak ada data antrian
                  </td>
                </tr>
              ) : (
                filtered.map(q => {
                  const airport = AIRPORTS.find(a => a.id === q.airportId)
                  return (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {q.number}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{q.driverName}</p>
                          <p className="text-xs text-gray-400">{airport?.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{q.plateNumber}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{q.pickupPoint}</td>
                      <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatTime(q.joinedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{q.calledAt ? formatTime(q.calledAt) : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {q.status === 'WAITING' && (
                            <button
                              onClick={() => updateStatus(q.id, 'CALLED')}
                              title="Panggil Driver"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {q.status === 'CALLED' && (
                            <button
                              onClick={() => updateStatus(q.id, 'PICKUP')}
                              title="Tandai Penjemputan"
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {q.status === 'PICKUP' && (
                            <button
                              onClick={() => updateStatus(q.id, 'COMPLETED')}
                              title="Selesaikan"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {['WAITING', 'CALLED'].includes(q.status) && (
                            <button
                              onClick={() => removeFromQueue(q.id)}
                              title="Hapus dari Antrian"
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {['COMPLETED', 'REMOVED'].includes(q.status) && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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
  )
}
