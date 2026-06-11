import { Building2, Car, ClipboardList, CheckCircle, TrendingUp } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import BarChart from '../charts/BarChart'
import NationalMap from '../maps/NationalMap'
import { AIRPORTS, NATIONAL_STATS } from '../services/mockData'
import StatusBadge from '../components/StatusBadge'

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function NationalDashboard() {
  return (
    <div className="space-y-6 fade-in">
      {/* RIFIM Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#1a4f8a] to-[#0ea5e9] p-6 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
        />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src="/rifim-logo.svg" alt="RIFIM" className="h-12 bg-white rounded-lg px-2 py-1" />
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Nasional</h1>
              <p className="text-sky-200 text-sm mt-1">{today}</p>
              <p className="text-sky-300 text-xs mt-0.5">PT. Rifim Gemilang — Operasional Seluruh Indonesia</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {AIRPORTS.filter(a => a.lat !== 0).map(a => (
              <span key={a.id} className="text-xs bg-white/20 text-white px-2 py-1 rounded-lg font-medium">{a.code}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Bandara Aktif"
          value={NATIONAL_STATS.totalAirports}
          subtitle="Di seluruh Indonesia"
          icon={Building2}
          color="blue"
          trend={0}
        />
        <StatsCard
          title="Driver Online Sekarang"
          value={NATIONAL_STATS.totalDriversOnline}
          subtitle="Dari 75 driver terdaftar"
          icon={Car}
          color="green"
          trend={8}
        />
        <StatsCard
          title="Antrian Aktif Hari Ini"
          value={NATIONAL_STATS.totalQueuesToday}
          subtitle="Menunggu + Dipanggil + Jemput"
          icon={ClipboardList}
          color="yellow"
          trend={-3}
        />
        <StatsCard
          title="Total Penjemputan Hari Ini"
          value={NATIONAL_STATS.totalPickupsToday}
          subtitle="Completed trips today"
          icon={CheckCircle}
          color="purple"
          trend={12}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Penjemputan per Bandara</h3>
              <p className="text-xs text-gray-400 mt-0.5">Hari ini</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-300" />
          </div>
          <BarChart
            labels={NATIONAL_STATS.airportNames}
            datasets={[{
              label: 'Penjemputan',
              data: NATIONAL_STATS.airportPickups,
              color: '#3b82f6',
            }]}
            height={260}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800">Driver Online per Bandara</h3>
            <p className="text-xs text-gray-400 mt-0.5">Hari ini</p>
          </div>
          <BarChart
            labels={NATIONAL_STATS.airportNames}
            datasets={[
              {
                label: 'Driver Online',
                data: AIRPORTS.map(a => a.driversOnline),
                color: '#10b981',
              },
              {
                label: 'Antrian Aktif',
                data: AIRPORTS.map(a => a.queueCount),
                color: '#f59e0b',
              },
            ]}
            height={260}
          />
        </div>
      </div>

      {/* National Map */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Peta Sebaran Bandara</h3>
          <p className="text-xs text-gray-400 mt-0.5">Klik marker untuk detail bandara</p>
        </div>
        <NationalMap airports={AIRPORTS} height={400} />
      </div>

      {/* Airport Summary Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Ringkasan Cabang RIFIM</h3>
          <span className="text-xs text-gray-400">{AIRPORTS.length} cabang aktif</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['ID Cabang', 'Bandara', 'Kota', 'TZ', 'Driver Online', 'Antrian', 'Staf', 'Penjemputan', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {AIRPORTS.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-blue-700 max-w-[180px] truncate" title={apt.id}>{apt.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{apt.name}</td>
                  <td className="px-4 py-3 text-gray-600">{apt.city}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${apt.tz === 'WITA' ? 'bg-yellow-100 text-yellow-700' : 'bg-sky-100 text-sky-700'}`}>{apt.tz}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-600">{apt.driversOnline}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-yellow-600">{apt.queueCount}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{apt.staffActive}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{apt.totalPickupsToday}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={apt.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
