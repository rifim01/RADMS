import { useState, useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '../firebase/config'
import { Car, Clock, MapPin, CheckCircle, Filter, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime } from '../utils/formatters'

function formatTs(ts) {
  if (!ts) return '-'
  const d = new Date(typeof ts === 'number' ? ts : ts)
  if (isNaN(d)) return '-'
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function TripsHistoryPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('all')

  useEffect(() => {
    // Listen to all trips in Firebase RTDB `trips/`
    const tripsRef = ref(db, 'trips')
    const unsub = onValue(tripsRef, snap => {
      const val = snap.val() || {}
      const allTrips = []
      Object.entries(val).forEach(([driverId, driverTrips]) => {
        if (typeof driverTrips === 'object' && driverTrips) {
          Object.entries(driverTrips).forEach(([tripId, trip]) => {
            allTrips.push({ id: tripId, driverId, ...trip })
          })
        }
      })
      // Sort newest first
      allTrips.sort((a, b) => (b.createdAt || b.startTime || 0) - (a.createdAt || a.startTime || 0))
      setTrips(allTrips)
      setLoading(false)
    })
    return () => off(tripsRef)
  }, [])

  // Filter by branch for non-super_admin
  const branchFiltered = user.role === 'super_admin'
    ? trips
    : trips.filter(t => t.branchId === user.airportId)

  // Filter by date
  const now = new Date()
  const dateFiltered = branchFiltered.filter(t => {
    if (filterDate === 'all') return true
    const ts = t.createdAt || t.startTime
    if (!ts) return false
    const d = new Date(ts)
    if (filterDate === 'today') {
      return d.toDateString() === now.toDateString()
    }
    if (filterDate === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    }
    return true
  })

  const completedCount = dateFiltered.filter(t => t.status === 'COMPLETED').length
  const uniqueDrivers = new Set(dateFiltered.map(t => t.driverId)).size

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengantaran</h1>
        <p className="text-gray-500 text-sm mt-1">Data real-time perjalanan driver dari Firebase</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{dateFiltered.length}</p>
              <p className="text-gray-400 text-xs mt-0.5">Total Perjalanan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{completedCount}</p>
              <p className="text-gray-400 text-xs mt-0.5">Selesai</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{uniqueDrivers}</p>
              <p className="text-gray-400 text-xs mt-0.5">Driver Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filter:</span>
          {[
            { value: 'all', label: 'Semua' },
            { value: 'today', label: 'Hari Ini' },
            { value: 'week', label: '7 Hari' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterDate(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterDate === opt.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {loading && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Memuat...
            </div>
          )}
        </div>
      </div>

      {/* Trips table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Daftar Perjalanan ({dateFiltered.length})
        </h3>
        {dateFiltered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Belum ada data perjalanan</p>
            <p className="text-gray-300 text-sm mt-1">
              {loading ? 'Memuat...' : 'Data akan muncul setelah driver menyelesaikan perjalanan'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Driver', 'Cabang/Bandara', 'Plat', 'Status', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dateFiltered.map((trip, i) => (
                  <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{trip.driverName || trip.driverId}</p>
                      <p className="text-xs text-gray-400 font-mono">{trip.driverId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{trip.branchId || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{trip.plateNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        trip.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700'
                          : trip.status === 'PICKUP'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {trip.status === 'COMPLETED' ? '✓ Selesai'
                          : trip.status === 'PICKUP' ? '🚗 Mengantarkan'
                          : trip.status || 'Proses'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatTs(trip.createdAt || trip.startTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
