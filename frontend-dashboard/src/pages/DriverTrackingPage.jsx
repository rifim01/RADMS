import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import DriverMap from '../maps/DriverMap'
import StatusBadge from '../components/StatusBadge'
import { DRIVERS, AIRPORTS } from '../services/mockData'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime } from '../utils/formatters'

export default function DriverTrackingPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAirport, setFilterAirport] = useState(user.airportId || 'all')
  const [selectedDriver, setSelectedDriver] = useState(null)

  const filtered = DRIVERS.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.plateNumber.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || d.status === filterStatus
    const matchAirport = filterAirport === 'all' || d.airportId === filterAirport
    return matchSearch && matchStatus && matchAirport
  })

  const mapDrivers = filtered.filter(d => d.lastLat && d.lastLng)

  const mapCenter = filterAirport !== 'all'
    ? AIRPORTS.find(a => a.id === filterAirport)
    : null

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pelacakan Driver</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau posisi dan status driver secara real-time</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama driver atau plat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
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
          <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Online: {filtered.filter(d => d.status === 'online').length}
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block ml-2"></span>
            Offline: {filtered.filter(d => d.status === 'offline').length}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Peta Posisi Driver</h3>
          <p className="text-xs text-gray-400 mt-0.5">Klik marker untuk detail driver</p>
        </div>
        {mapDrivers.length > 0 ? (
          <DriverMap
            drivers={mapDrivers}
            center={mapCenter ? [mapCenter.lat, mapCenter.lng] : undefined}
            zoom={mapCenter ? 13 : 5}
            height={450}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Tidak ada driver yang sesuai filter
          </div>
        )}
      </div>

      {/* Driver Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Daftar Driver ({filtered.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['No', 'Nama Driver', 'Kendaraan', 'Plat', 'Bandara', 'Status', 'Kecepatan', 'Koordinat', 'Terakhir Aktif', 'Rating'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((d, i) => {
                const airport = AIRPORTS.find(a => a.id === d.airportId)
                return (
                  <tr
                    key={d.id}
                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedDriver?.id === d.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDriver(d)}
                  >
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.vehicle}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.plateNumber}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{airport?.code} — {airport?.city}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.status === 'online' ? (
                        <span className={d.speed > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                          {d.speed} km/j
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {d.lastLat.toFixed(4)}, {d.lastLng.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatRelativeTime(d.lastSeen)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-500 font-medium">
                        ★ {d.rating}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
