import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, RefreshCw, ExternalLink } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'
import { DRIVERS as INITIAL_DRIVERS, AIRPORTS } from '../services/mockData'
import { fetchAllDrivers } from '../services/sheetsService'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  name: '', nik: '', phone: '', vehicle: '', plateNumber: '',
  airportId: AIRPORTS[0]?.id || '', status: 'offline', rating: 4.5,
}

export default function DriversPage() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS)
  const [dataSource, setDataSource] = useState('mock')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterAirport, setFilterAirport] = useState(user.role === 'super_admin' ? 'all' : (user.airportId || 'all'))

  useEffect(() => {
    loadDrivers()
  }, [])

  async function loadDrivers() {
    setLoading(true)
    const { data, source } = await fetchAllDrivers(INITIAL_DRIVERS)
    setDrivers(data)
    setDataSource(source)
    setLoading(false)
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  // Build unique branch list from loaded data (not from mock AIRPORTS)
  const branchList = [...new Set(drivers.map(d => d.airportId).filter(Boolean))].sort()

  const filtered = drivers.filter(d => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.plateNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.nik || '').includes(search)
    const matchAirport = filterAirport === 'all' || d.airportId === filterAirport
    return matchSearch && matchAirport
  })

  function openAdd() {
    setForm({ ...emptyForm, airportId: user.airportId || 'apt-1' })
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(driver) {
    setForm({ ...driver })
    setEditId(driver.id)
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.name || !form.nik || !form.plateNumber) {
      alert('Mohon lengkapi nama, NIK, dan plat nomor')
      return
    }
    if (editId) {
      setDrivers(prev => prev.map(d => d.id === editId ? { ...d, ...form } : d))
    } else {
      const newDriver = {
        ...form,
        id: `drv-${Date.now()}`,
        lastLat: AIRPORTS.find(a => a.id === form.airportId)?.lat || -5.0617,
        lastLng: AIRPORTS.find(a => a.id === form.airportId)?.lng || 119.5543,
        speed: 0,
        lastSeen: new Date().toISOString(),
        totalPickups: 0,
        joinDate: new Date().toISOString().slice(0, 10),
      }
      setDrivers(prev => [...prev, newDriver])
    }
    setModalOpen(false)
  }

  function handleDelete(id) {
    setDrivers(prev => prev.filter(d => d.id !== id))
    setDeleteModal(null)
  }

  const columns = [
    { header: '#', key: 'id', render: (_, row) => <span className="text-gray-400 text-xs">{filtered.indexOf(row) + 1}</span> },
    { header: 'Nama Driver', key: 'name', render: v => <span className="font-medium text-gray-800">{v}</span> },
    { header: 'NIK', key: 'nik', render: v => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { header: 'Telepon', key: 'phone', render: v => <span className="text-gray-600">{v}</span> },
    { header: 'Kendaraan', key: 'vehicle', render: v => <span className="text-gray-600">{v}</span> },
    { header: 'Plat', key: 'plateNumber', render: v => <span className="font-mono text-xs font-semibold text-gray-700">{v}</span> },
    { header: 'Cabang', key: 'airportId', render: v => {
      const a = AIRPORTS.find(ap => ap.id === v)
      const label = a ? `${a.code} — ${a.city}` : (v || '-')
      return <span className="text-gray-600 text-xs">{label}</span>
    }},
    { header: 'Status', key: 'status', render: v => <StatusBadge status={v} /> },
    { header: 'Rating', key: 'rating', render: v => <span className="text-yellow-500 font-medium">★ {v}</span> },
    { header: 'Aksi', key: 'id', render: (_, row) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openEdit(row)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDeleteModal(row)}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img src="/rifim-logo.svg" alt="RIFIM" className="h-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Data Driver — {user.role === 'super_admin' ? 'Semua Cabang' : user.airportId}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-gray-500 text-sm">Kelola data driver yang terdaftar</p>
              {dataSource === 'google_sheets'
                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Google Sheets</span>
                : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Demo Mode</span>
              }
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadDrivers} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <a href={`https://docs.google.com/spreadsheets/d/1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_Tlc`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm rounded-lg transition"
          >
            <ExternalLink className="w-4 h-4" /> Sheet
          </a>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah Driver
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, plat, atau NIK..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {user.role === 'super_admin' ? (
          <select
            value={filterAirport}
            onChange={e => setFilterAirport(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Cabang</option>
            {branchList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        ) : (
          <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
            {user.airportId || 'Semua Cabang'}
          </span>
        )}
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          Total: <span className="font-semibold text-gray-800 ml-1">{filtered.length}</span> driver
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <DataTable columns={columns} data={filtered} pageSize={8} />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Driver' : 'Tambah Driver Baru'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama driver"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIK *</label>
              <input
                type="text"
                value={form.nik}
                onChange={e => setForm(f => ({ ...f, nik: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="16 digit NIK"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Kendaraan</label>
              <input
                type="text"
                value={form.vehicle}
                onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Misal: Toyota Avanza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Plat Nomor *</label>
              <input
                type="text"
                value={form.plateNumber}
                onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD 1234 AB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bandara</label>
              <select
                value={form.airportId}
                onChange={e => setForm(f => ({ ...f, airportId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AIRPORTS.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              {editId ? 'Simpan Perubahan' : 'Tambah Driver'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div>
          <p className="text-gray-600 text-sm">
            Apakah Anda yakin ingin menghapus driver <strong>{deleteModal?.name}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setDeleteModal(null)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={() => handleDelete(deleteModal.id)}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
