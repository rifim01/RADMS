import { Building2, Car, ClipboardList, CheckCircle, TrendingUp } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import BarChart from '../charts/BarChart'
import NationalMap from '../maps/NationalMap'
import { AIRPORTS, NATIONAL_STATS } from '../services/mockData'
import StatusBadge from '../components/StatusBadge'

export default function NationalDashboard() {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <img src="/rifim-logo.svg" alt="RIFIM" className="h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Nasional</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan operasional seluruh bandara - 10 Juni 2026</p>
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
        <h3 className="font-semibold text-gray-800 mb-4">Ringkasan Bandara</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Kode', 'Bandara', 'Kota', 'Driver Online', 'Antrian', 'Staf Aktif', 'Penjemputan', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {AIRPORTS.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-600">{apt.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{apt.name}</td>
                  <td className="px-4 py-3 text-gray-600">{apt.city}</td>
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
