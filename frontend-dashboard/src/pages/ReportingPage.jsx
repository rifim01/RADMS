import { useState } from 'react'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import BarChart from '../charts/BarChart'
import LineChart from '../charts/LineChart'
import { REPORT_DATA, AIRPORTS, DRIVERS, KPI_DATA } from '../services/mockData'
import { useAuth } from '../context/AuthContext'
import { exportToCSV, exportToPDF, exportToExcel } from '../utils/exportUtils'

export default function ReportingPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('weekly')
  const [filterAirport, setFilterAirport] = useState(user.airportId || 'all')
  const [reportType, setReportType] = useState('pickups')

  const periodOptions = [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
  ]

  const currentData = REPORT_DATA[period]

  function handleExportCSV() {
    const data = currentData.labels.map((l, i) => ({
      Periode: l,
      Penjemputan: currentData.pickups[i],
      Antrian: currentData.queues[i],
    }))
    exportToCSV(data, `laporan_${period}`)
  }

  function handleExportDriverCSV() {
    const data = DRIVERS.map(d => ({
      Nama: d.name,
      NIK: d.nik,
      Telepon: d.phone,
      Kendaraan: d.vehicle,
      Plat: d.plateNumber,
      Bandara: AIRPORTS.find(a => a.id === d.airportId)?.name,
      Status: d.status,
      TotalPenjemputan: d.totalPickups,
      Rating: d.rating,
    }))
    exportToCSV(data, 'laporan_driver')
  }

  function handleExportKPI() {
    const data = KPI_DATA.map(d => ({
      Nama: d.driverName,
      Bandara: AIRPORTS.find(a => a.id === d.airportId)?.name,
      Kehadiran: d.attendance,
      KepatuhanAntrian: d.queueCompliance,
      AktivitasJemput: d.pickupActivity,
      WaktuRespon: d.responseTime,
      Pelanggaran: d.violation,
      SkorTotal: d.totalScore,
      Grade: d.grade,
    }))
    exportToCSV(data, 'laporan_kpi')
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
        <p className="text-gray-500 text-sm mt-1">Ekspor dan analisis data operasional</p>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Laporan Penjemputan</p>
              <p className="text-xs text-gray-400">Data harian/mingguan/bulanan</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition font-medium"
          >
            Unduh CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Table className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Data Driver Lengkap</p>
              <p className="text-xs text-gray-400">Profil semua driver terdaftar</p>
            </div>
          </div>
          <button
            onClick={handleExportDriverCSV}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition font-medium"
          >
            Unduh CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Laporan KPI</p>
              <p className="text-xs text-gray-400">Skor kinerja semua driver</p>
            </div>
          </div>
          <button
            onClick={handleExportKPI}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition font-medium"
          >
            Unduh CSV
          </button>
        </div>
      </div>

      {/* Main Report Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {periodOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  period === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
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
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => exportToPDF('Laporan Operasional RADMS')}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 border border-green-200 text-green-600 text-sm rounded-lg hover:bg-green-50 transition"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3 text-sm">Penjemputan & Antrian</h4>
            <BarChart
              labels={currentData.labels}
              datasets={[
                { label: 'Penjemputan', data: currentData.pickups, color: '#3b82f6' },
                { label: 'Antrian', data: currentData.queues, color: '#10b981' },
              ]}
              height={260}
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3 text-sm">Tren Penjemputan</h4>
            <LineChart
              labels={currentData.labels}
              datasets={[
                { label: 'Penjemputan', data: currentData.pickups, color: '#3b82f6' },
                { label: 'Antrian', data: currentData.queues, color: '#f59e0b' },
              ]}
              height={260}
            />
          </div>
        </div>

        {/* Preview Table */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Pratinjau Data</h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Periode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Penjemputan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Antrian</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rasio Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.labels.map((label, i) => {
                  const ratio = currentData.queues[i] > 0
                    ? ((currentData.pickups[i] / currentData.queues[i]) * 100).toFixed(1)
                    : 0
                  return (
                    <tr key={label} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700">{label}</td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">{currentData.pickups[i]}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{currentData.queues[i]}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${Number(ratio) >= 100 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                          {ratio}%
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
    </div>
  )
}
