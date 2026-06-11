import { Car, ClipboardList, Users, CheckCircle, AlertCircle } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import BarChart from '../charts/BarChart'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { AIRPORTS, DRIVERS, QUEUE_DATA, REPORT_DATA } from '../services/mockData'
import { formatRelativeTime } from '../utils/formatters'

export default function AirportDashboard() {
  const { user } = useAuth()

  const airport = user.airportId
    ? AIRPORTS.find(a => a.id === user.airportId)
    : AIRPORTS[0]

  const aptDrivers = DRIVERS.filter(d => d.airportId === airport.id)
  const aptQueue = QUEUE_DATA.filter(q => q.airportId === airport.id)

  const onlineDrivers = aptDrivers.filter(d => d.status === 'online')
  const activeQueue = aptQueue.filter(q => ['WAITING', 'CALLED', 'PICKUP'].includes(q.status))
  const completedToday = aptQueue.filter(q => q.status === 'COMPLETED')

  const recentActivity = aptQueue.slice(0, 5)

  return (
    <div className="space-y-6 fade-in">
      {/* RIFIM Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#1a4f8a] to-[#0ea5e9] p-5 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
        />
        <div className="relative flex items-center gap-4 flex-wrap">
          <img src="/rifim-logo.svg" alt="RIFIM" className="h-10 bg-white rounded-lg px-2 py-1" />
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard Bandara</h1>
            <p className="text-sky-200 text-sm mt-0.5">{airport.id}</p>
            <p className="text-sky-300 text-xs">{airport.fullName} &bull; {airport.city} &bull; <span className={`font-bold ${airport.tz === 'WITA' ? 'text-yellow-300' : 'text-sky-200'}`}>{airport.tz}</span></p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Driver Online"
          value={onlineDrivers.length}
          subtitle={`Dari ${aptDrivers.length} driver terdaftar`}
          icon={Car}
          color="green"
          trend={5}
        />
        <StatsCard
          title="Antrian Aktif"
          value={activeQueue.length}
          subtitle="Menunggu + Dipanggil + Jemput"
          icon={ClipboardList}
          color="yellow"
        />
        <StatsCard
          title="Staf Aktif"
          value={airport.staffActive}
          subtitle="Dari 5 staf terdaftar"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Selesai Hari Ini"
          value={airport.totalPickupsToday}
          subtitle="Penjemputan berhasil"
          icon={CheckCircle}
          color="purple"
          trend={10}
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Tren Mingguan — Penjemputan & Antrian</h3>
          <BarChart
            labels={REPORT_DATA.weekly.labels}
            datasets={[
              { label: 'Penjemputan', data: REPORT_DATA.weekly.pickups.map(v => Math.round(v * (airport.totalPickupsToday / 112))), color: '#3b82f6' },
              { label: 'Antrian', data: REPORT_DATA.weekly.queues.map(v => Math.round(v * (airport.queueCount / 28))), color: '#10b981' },
            ]}
            height={260}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Aktivitas Terkini</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Tidak ada aktivitas</p>
            ) : (
              recentActivity.map(q => (
                <div key={q.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition">
                  <StatusBadge status={q.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{q.driverName}</p>
                    <p className="text-xs text-gray-400">{q.pickupPoint}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Driver Status Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Status Driver</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Nama Driver', 'Kendaraan', 'Plat', 'Status', 'Kecepatan', 'Terakhir Aktif'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {aptDrivers.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.vehicle}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.plateNumber}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{d.status === 'online' ? `${d.speed} km/j` : '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatRelativeTime(d.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
