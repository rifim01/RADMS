import { useState, useEffect, useMemo } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { listenAllDriverStatus, listenAllDriverLocations } from '../services/realtimeService'
import DriverMap from '../maps/DriverMap'
import StatusBadge from '../components/StatusBadge'
import { AIRPORTS } from '../services/mockData'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime } from '../utils/formatters'
import { fetchAllDrivers } from '../services/sheetsService'

// Module-level caches — survive tab navigation without re-fetching
let _statusCache = []
let _locationCache = []
let _sheetCache = []

export default function DriverTrackingPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [statusRows, setStatusRows] = useState(_statusCache)
  const [locationRows, setLocationRows] = useState(_locationCache)
  const [sheetDrivers, setSheetDrivers] = useState(_sheetCache)
  const [loading, setLoading] = useState(_sheetCache.length === 0)

  // Listen to Supabase realtime for online status + GPS locations (written by driver app)
  useEffect(() => {
    const unsubStatus = listenAllDriverStatus(rows => {
      _statusCache = rows
      setStatusRows(rows)
    })
    const unsubLocation = listenAllDriverLocations(rows => {
      _locationCache = rows
      setLocationRows(rows)
    })
    return () => { unsubStatus(); unsubLocation() }
  }, [])

  // Merge status + location rows into one map keyed by driver_id (= NIK)
  const rtdbDrivers = useMemo(() => {
    const map = {}
    statusRows.forEach(r => {
      map[r.driver_id] = { ...(map[r.driver_id] || {}), isOnline: r.is_online, lastSeen: r.last_seen }
    })
    locationRows.forEach(r => {
      const existing = map[r.driver_id] || {}
      map[r.driver_id] = {
        ...existing,
        location: { lat: r.lat, lng: r.lng, isOnline: r.is_online, branchId: r.branch_id, speed: r.speed || 0 },
        isOnline: existing.isOnline !== undefined ? existing.isOnline : r.is_online,
        lastSeen: existing.lastSeen !== undefined ? existing.lastSeen : r.updated_at,
      }
    })
    return map
  }, [statusRows, locationRows])

  // Load driver list from sheet (cache in module var — re-uses 5-min cache from sheetsService)
  useEffect(() => {
    if (_sheetCache.length > 0) return  // already loaded this session
    fetchAllDrivers([]).then(result => {
      _sheetCache = result?.data || []
      setSheetDrivers(_sheetCache)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Merge sheet data with RTDB real-time data
  const mergedDrivers = sheetDrivers.map(d => {
    const nik = d.nik || d.id || ''
    const rtdb = rtdbDrivers[nik] || {}
    const loc = rtdb.location || {}
    // Check both root-level isOnline and location-embedded isOnline
    const isOnline = rtdb.isOnline === true || loc.isOnline === true
    return {
      ...d,
      isOnline,
      lastLat: loc.lat || null,
      lastLng: loc.lng || null,
      speed: loc.speed || 0,
      lastSeen: rtdb.lastSeen || null,
    }
  })

  // Also show RTDB-only drivers (those not yet in sheet list)
  const rtdbOnlyNiks = Object.keys(rtdbDrivers).filter(
    nik => !sheetDrivers.find(d => (d.nik || d.id) === nik)
  )
  const rtdbOnlyDrivers = rtdbOnlyNiks.map(nik => {
    const rtdb = rtdbDrivers[nik]
    const loc = rtdb.location || {}
    return {
      id: nik,
      nik,
      name: rtdb.name || nik,
      airportId: loc.branchId || rtdb.branchId || '',
      isOnline: rtdb.isOnline === true || loc.isOnline === true,
      lastLat: loc.lat || null,
      lastLng: loc.lng || null,
      speed: loc.speed || 0,
      lastSeen: rtdb.lastSeen || null,
      vehicle: '',
      plateNumber: '',
      rating: null,
    }
  })

  const allDrivers = [...mergedDrivers, ...rtdbOnlyDrivers]

  // Filter by branch for non-super_admin
  const branchFiltered = user.role === 'super_admin'
    ? allDrivers
    : allDrivers.filter(d => d.airportId === user.airportId)

  const filtered = branchFiltered.filter(d => {
    const matchSearch = !search ||
      (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.plateNumber || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'online' && d.isOnline) ||
      (filterStatus === 'offline' && !d.isOnline)
    return matchSearch && matchStatus
  })

  // Map drivers: only those with GPS location
  const mapDrivers = filtered
    .filter(d => d.lastLat && d.lastLng)
    .map(d => ({
      ...d,
      status: d.isOnline ? 'online' : 'offline',
    }))

  // Center map on user's airport
  const userAirport = user.airportId ? AIRPORTS.find(a => a.id === user.airportId) : null

  const onlineCount = filtered.filter(d => d.isOnline).length
  const offlineCount = filtered.filter(d => !d.isOnline).length

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pelacakan Driver</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau posisi dan status driver secara real-time</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
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
          <div className="flex items-center gap-3 text-sm text-gray-500 ml-auto">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Online: <strong className="text-gray-700">{onlineCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
              Offline: <strong className="text-gray-700">{offlineCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Peta Posisi Driver</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {mapDrivers.length} driver dengan lokasi aktif · Klik marker untuk detail
          </p>
        </div>
        {mapDrivers.length > 0 ? (
          <DriverMap
            drivers={mapDrivers}
            center={userAirport ? [userAirport.lat, userAirport.lng] : undefined}
            zoom={userAirport ? 13 : 5}
            height={450}
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
            <RefreshCw className="w-8 h-8 text-gray-200" />
            <p className="text-sm">Menunggu data GPS driver...</p>
            <p className="text-xs text-gray-300">Driver harus aktif di aplikasi untuk muncul di peta</p>
          </div>
        )}
      </div>

      {/* Driver Table — all drivers online + offline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            Semua Driver ({filtered.length})
          </h3>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Memuat data...
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['No', 'Nama Driver', 'Plat / Kendaraan', 'Bandara', 'Status', 'Kecepatan', 'Koordinat GPS', 'Terakhir Aktif', 'Rating'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((d, i) => {
                const airport = AIRPORTS.find(a => a.id === d.airportId)
                const hasGps = d.lastLat && d.lastLng
                return (
                  <tr key={d.nik || d.id || i} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="font-mono text-xs">{d.plateNumber || '-'}</span>
                      {d.vehicle && <span className="text-gray-400 text-xs ml-1">· {d.vehicle}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {airport ? `${airport.code} — ${airport.city}` : (d.airportId || '-')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.isOnline ? 'online' : 'offline'} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.isOnline && d.speed > 0 ? (
                        <span className="text-blue-600 font-medium">{Math.round(d.speed)} km/j</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {hasGps ? `${d.lastLat.toFixed(4)}, ${d.lastLng.toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {d.lastSeen ? formatRelativeTime(d.lastSeen) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {d.rating ? (
                        <span className="flex items-center gap-1 text-yellow-500 font-medium">
                          ★ {d.rating}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    Tidak ada driver yang sesuai filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
