import { useState } from 'react'
import { UserCheck, UserX, Clock, Calendar } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import StatusBadge from '../components/StatusBadge'
import { ATTENDANCE_RECORDS, AIRPORTS } from '../services/mockData'
import { useAuth } from '../context/AuthContext'

export default function AttendancePage() {
  const { user } = useAuth()
  const [filterDate, setFilterDate] = useState('2026-06-10')
  const [filterAirport, setFilterAirport] = useState(user.airportId || 'all')

  const filtered = ATTENDANCE_RECORDS.filter(r => {
    const matchDate = !filterDate || r.date === filterDate
    const matchAirport = filterAirport === 'all' || r.airportId === filterAirport
    return matchDate && matchAirport
  })

  const hadir = filtered.filter(r => r.status === 'hadir').length
  const terlambat = filtered.filter(r => r.status === 'terlambat').length
  const tidakHadir = filtered.filter(r => r.status === 'tidak_hadir').length
  const sudahCheckout = filtered.filter(r => r.checkOut).length

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Kehadiran Staf</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau kehadiran dan jam kerja staf operasional</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Hadir" value={hadir} icon={UserCheck} color="green" />
        <StatsCard title="Terlambat" value={terlambat} icon={Clock} color="yellow" />
        <StatsCard title="Tidak Hadir" value={tidakHadir} icon={UserX} color="red" />
        <StatsCard title="Sudah Check-out" value={sudahCheckout} icon={Calendar} color="blue" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Tanggal:</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {user.role === 'super_admin' && (
          <select
            value={filterAirport}
            onChange={e => setFilterAirport(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Bandara</option>
            {AIRPORTS.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Rekap Kehadiran</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Nama Staf', 'Bandara', 'Tanggal', 'Check In', 'Check Out', 'Lokasi Check In', 'Durasi', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Tidak ada data kehadiran
                  </td>
                </tr>
              ) : (
                filtered.map(r => {
                  const airport = AIRPORTS.find(a => a.id === r.airportId)

                  // Calculate duration
                  let duration = '-'
                  if (r.checkIn && r.checkOut) {
                    const [inH, inM] = r.checkIn.split(':').map(Number)
                    const [outH, outM] = r.checkOut.split(':').map(Number)
                    const mins = (outH * 60 + outM) - (inH * 60 + inM)
                    duration = `${Math.floor(mins / 60)}j ${mins % 60}m`
                  } else if (r.checkIn && !r.checkOut) {
                    const [inH, inM] = r.checkIn.split(':').map(Number)
                    const now = new Date()
                    const nowMins = now.getHours() * 60 + now.getMinutes()
                    const mins = nowMins - (inH * 60 + inM)
                    if (mins > 0) duration = `${Math.floor(mins / 60)}j ${mins % 60}m (aktif)`
                  }

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.staffName}</td>
                      <td className="px-4 py-3 text-gray-600">{airport?.code} — {airport?.city}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3">
                        {r.checkIn
                          ? <span className="text-emerald-600 font-medium">{r.checkIn}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {r.checkOut
                          ? <span className="text-blue-600 font-medium">{r.checkOut}</span>
                          : r.checkIn
                            ? <span className="text-yellow-500 text-xs">Belum checkout</span>
                            : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{r.locationIn || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{duration}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
