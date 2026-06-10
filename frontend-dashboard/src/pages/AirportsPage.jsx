import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'
import { AIRPORTS as INITIAL_AIRPORTS } from '../services/mockData'
import { formatDate } from '../utils/formatters'

const emptyForm = {
  code: '', name: '', city: '', province: '', fullName: '',
  lat: '', lng: '', status: 'active',
}

export default function AirportsPage() {
  const [airports, setAirports] = useState(INITIAL_AIRPORTS)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const filtered = airports.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(apt) {
    setForm({ ...apt })
    setEditId(apt.id)
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.code || !form.name || !form.city) {
      alert('Mohon lengkapi kode, nama, dan kota bandara')
      return
    }
    if (editId) {
      setAirports(prev => prev.map(a => a.id === editId ? { ...a, ...form, lat: Number(form.lat), lng: Number(form.lng) } : a))
    } else {
      const newApt = {
        ...form,
        id: `apt-${Date.now()}`,
        lat: Number(form.lat) || 0,
        lng: Number(form.lng) || 0,
        driversOnline: 0,
        queueCount: 0,
        staffActive: 0,
        totalPickupsToday: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setAirports(prev => [...prev, newApt])
    }
    setModalOpen(false)
  }

  function handleDelete(id) {
    setAirports(prev => prev.filter(a => a.id !== id))
    setDeleteModal(null)
  }

  const columns = [
    { header: 'Kode', key: 'code', render: v => <span className="font-bold text-blue-600 text-sm">{v}</span> },
    { header: 'Nama Bandara', key: 'name', render: v => <span className="font-medium text-gray-800">{v}</span> },
    { header: 'Kota', key: 'city', render: v => <span className="text-gray-600">{v}</span> },
    { header: 'Provinsi', key: 'province', render: v => <span className="text-gray-500 text-xs">{v}</span> },
    { header: 'Driver Online', key: 'driversOnline', render: v => <span className="font-semibold text-emerald-600">{v}</span> },
    { header: 'Antrian', key: 'queueCount', render: v => <span className="font-semibold text-yellow-600">{v}</span> },
    { header: 'Staf Aktif', key: 'staffActive', render: v => <span className="font-semibold text-blue-600">{v}</span> },
    { header: 'Koordinat', key: 'lat', render: (v, row) => (
      <span className="text-xs font-mono text-gray-400">{row.lat.toFixed(3)}, {row.lng.toFixed(3)}</span>
    )},
    { header: 'Status', key: 'status', render: v => <StatusBadge status={v} /> },
    { header: 'Dibuat', key: 'createdAt', render: v => <span className="text-gray-500 text-xs">{formatDate(v)}</span> },
    { header: 'Aksi', key: 'id', render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setDeleteModal(row)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Bandara</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola data bandara yang terdaftar dalam sistem</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition font-medium">
          <Plus className="w-4 h-4" /> Tambah Bandara
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {filtered.map(apt => (
          <div key={apt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="font-bold text-blue-600 text-sm">{apt.code}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{apt.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {apt.city}, {apt.province}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50 rounded-lg p-2">
                <p className="font-bold text-emerald-600 text-lg">{apt.driversOnline}</p>
                <p className="text-gray-500">Driver</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="font-bold text-yellow-600 text-lg">{apt.queueCount}</p>
                <p className="text-gray-500">Antrian</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="font-bold text-blue-600 text-lg">{apt.staffActive}</p>
                <p className="text-gray-500">Staf</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari bandara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <DataTable columns={columns} data={filtered} pageSize={10} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Data Bandara' : 'Tambah Bandara Baru'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode IATA *</label>
              <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="UPG" maxLength={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Singkat *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sultan Hasanuddin" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
              <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Bandar Udara Internasional..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kota *</label>
              <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Makassar" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Provinsi</label>
              <input type="text" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sulawesi Selatan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lintang (Lat)</label>
              <input type="number" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} step="0.0001"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="-5.0617" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bujur (Lng)</label>
              <input type="number" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} step="0.0001"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="119.5543" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium">
              {editId ? 'Simpan Perubahan' : 'Tambah Bandara'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Konfirmasi Hapus" size="sm">
        <div>
          <p className="text-gray-600 text-sm">Hapus bandara <strong>{deleteModal?.name} ({deleteModal?.code})</strong>? Data terkait tidak akan terhapus otomatis.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Batal</button>
            <button onClick={() => handleDelete(deleteModal.id)} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">Hapus</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
