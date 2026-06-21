import { useState, useEffect } from 'react'
import { Car, ClipboardList, Users, CheckCircle, AlertCircle } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import BarChart from '../charts/BarChart'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { fetchAllDrivers } from '../services/sheetsService'
import { formatRelativeTime } from '../utils/formatters'

const BRANCH_LABELS = {
  "ID Rifim Airport Batam":      "Bandara Hang Nadim — Batam",
  "ID Rifim Airport Jambi":      "Bandara Sultan Thaha — Jambi",
  "ID Rifim Airport Balikpapan": "Bandara SAMS Sepinggan — Balikpapan",
  "ID Rifim Airport Manado":     "Bandara Sam Ratulangi — Manado",
  "ID Rifim Airport Pekanbaru":  "Bandara Sultan Syarif Kasim II — Pekanbaru",
  "ID Rifim Batam":              "Area Batam (Eksternal)",
  "ID Rifim Jambi Luar":         "Area Jambi Luar (Eksternal)",
}

export default function AirportDashboard() {
  const { user } = useAuth()
  const [aptDrivers, setAptDrivers] = useState([])

  const currentBranchId = user.airportId || Object.keys(BRANCH_LABELS)[0]
  const branchLabel = BRANCH_LABELS[currentBranchId] || currentBranchId

  useEffect(() => {
    fetchAllDrivers().then(({ data }) => {
      const filtered = user.airportId
        ? data.filter(d => d.airportId === user.airportId)
        : data
      setAptDrivers(filtered)
    }).catch(() => {})
  }, [user.airportId])

  const aptQueue = []

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
            <p className="text-sky-200 text-sm mt-0.5">{currentBranchId}</p>
            <p className="text-sky-300 text-xs">{branchLabel}</p>
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
          value="—"
          subtitle="Data dari sistem absensi"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Selesai Hari Ini"
          value={completedToday.length}
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
            labels={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']}
            datasets={[
              { label: 'Penjemputan', data: [0, 0, 0, 0, 0, 0, 0], color: '#3b82f6' },
              { label: 'Antrian', data: [0, 0, 0, 0, 0, 0, 0], color: '#10b981' },
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
