import { useState } from 'react'
import { BarChart2, TrendingUp, Award } from 'lucide-react'
import KPIChart from '../charts/KPIChart'
import { AIRPORTS } from '../services/mockData'
import { useAuth } from '../context/AuthContext'
import { gradeColor, scoreColor } from '../utils/formatters'

const KPI_WEIGHTS = [
  { key: 'attendance', label: 'Kehadiran', weight: '20%' },
  { key: 'queueCompliance', label: 'Kepatuhan Antrian', weight: '20%' },
  { key: 'pickupActivity', label: 'Aktivitas Penjemputan', weight: '30%' },
  { key: 'responseTime', label: 'Waktu Respon', weight: '20%' },
  { key: 'violation', label: 'Pelanggaran (Negatif)', weight: '10%' },
]

export default function KPIAnalyticsPage() {
  const { user } = useAuth()
  const [filterAirport, setFilterAirport] = useState(user.airportId || 'all')
  const [sortKey, setSortKey] = useState('totalScore')

  const filtered = []
    .filter(d => filterAirport === 'all' || d.airportId === filterAirport)
    .sort((a, b) => b[sortKey] - a[sortKey])

  const avgScore = filtered.length
    ? (filtered.reduce((s, d) => s + d.totalScore, 0) / filtered.length).toFixed(1)
    : 0
  const topPerformer = filtered[0]
  const aPlus = filtered.filter(d => d.grade === 'A+').length

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Analitik KPI Driver</h1>
        <p className="text-gray-500 text-sm mt-1">Evaluasi kinerja driver berdasarkan indikator KPI</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Rata-rata Skor KPI</p>
          <p className="text-3xl font-bold mt-1" style={{ color: scoreColor(Number(avgScore)) }}>{avgScore}</p>
          <p className="text-xs text-gray-400 mt-1">dari 100 poin</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Performa Terbaik</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{topPerformer?.driverName || '-'}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Skor: {topPerformer?.totalScore}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Grade A+ (Excellent)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{aPlus}</p>
          <p className="text-xs text-gray-400 mt-1">dari {filtered.length} driver</p>
        </div>
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
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="totalScore">Urutkan: Skor Total</option>
          <option value="attendance">Urutkan: Kehadiran</option>
          <option value="pickupActivity">Urutkan: Aktivitas Jemput</option>
          <option value="responseTime">Urutkan: Waktu Respon</option>
        </select>
      </div>

      {/* KPI Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Grafik KPI per Driver</h3>
        <p className="text-xs text-gray-400 mb-4">Skor 0–100 per indikator KPI</p>
        <KPIChart kpiData={filtered} height={380} />
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Tabel KPI Detail</h3>
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-500">
          {KPI_WEIGHTS.map(k => (
            <span key={k.key} className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
              {k.label}: <strong>{k.weight}</strong>
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Nama Driver', 'Bandara', 'Kehadiran', 'Kepatuhan Antrian', 'Aktivitas Jemput', 'Waktu Respon', 'Pelanggaran', 'Skor Total', 'Grade'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((d, i) => {
                const airport = AIRPORTS.find(a => a.id === d.airportId)
                return (
                  <tr key={d.driverId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.driverName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{airport?.code}</td>
                    {['attendance', 'queueCompliance', 'pickupActivity', 'responseTime', 'violation'].map(k => (
                      <td key={k} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-12">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${d[k]}%`, backgroundColor: scoreColor(d[k]) }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{d[k]}</span>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800" style={{ color: scoreColor(d.totalScore) }}>
                        {d.totalScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-lg ${gradeColor(d.grade)}`}>{d.grade}</span>
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
