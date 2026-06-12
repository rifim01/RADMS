import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, RefreshCw, ExternalLink } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'
import { STAFF as INITIAL_STAFF, AIRPORTS } from '../services/mockData'
import { fetchAllStaff } from '../services/sheetsService'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatters'

const emptyForm = {
  name: '', nik: '', phone: '', email: '',
  role: 'Staff', airportId: '', status: 'active',
}

export default function StaffPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [dataSource, setDataSource] = useState('mock')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterAirport, setFilterAirport] = useState(
    user.role === 'super_admin' ? 'all' : (user.airportId || 'all')
  )

  useEffect(() => { loadStaff() }, [])

  async function loadStaff() {
    setLoading(true)
    const { data, source } = await fetchAllStaff(INITIAL_STAFF)
    setStaff(data)
    setDataSource(source)
    setLoading(false)
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const branchFromData = [...new Set(staff.map(s => s.airportId).filter(Boolean))].sort()
  const branchList = branchFromData.length > 0 ? branchFromData : AIRPORTS.map(a => a.id)

  const filtered = staff.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase())
    const matchAirport = filterAirport === 'all' || s.airportId === filterAirport
    return matchSearch && matchAirport
  })

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(s) {
    setForm({ ...s })
    setEditId(s.id)
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.name || !form.email) {
      alert('Mohon lengkapi nama dan email')
      return
    }
    if (editId) {
      setStaff(prev => prev.map(s => s.id === editId ? { ...s, ...form } : s))
    } else {
      const newStaff = {
        ...form,
        id: `stf-${Date.now()}`,
        joinDate: new Date().toISOString().slice(0, 10),
        lastCheckin: null,
      }
      setStaff(prev => [...prev, newStaff])
    }
    setModalOpen(false)
  }

  function handleDelete(id) {
    setStaff(prev => prev.filter(s => s.id !== id))
    setDeleteModal(null)
  }

  const columns = [
    { header: '#', key: 'id', render: (_, row) => <span className="text-gray-400 text-xs">{filtered.indexOf(row) + 1}</span> },
    { header: 'ID Staff', key: 'staffId', render: v => <span className="font-mono text-xs font-semibold text-blue-600">{v}</span> },
    { header: 'Nama Staf', key: 'name', render: v => <span className="font-medium text-gray-800">{v}</span> },
    { header: 'Email', key: 'email', render: v => <span className="text-gray-500 text-xs">{v}</span> },
    { header: 'Jabatan', key: 'role', render: v => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        v === 'KOORDINATOR'   ? 'bg-purple-100 text-purple-700 border-purple-200'
        : v === 'ADMIN'       ? 'bg-red-100 text-red-700 border-red-200'
        : v === 'PICKUP POINT'? 'bg-blue-100 text-blue-700 border-blue-200'
        :                       'bg-gray-100 text-gray-600 border-gray-200'
      }`}>{v}</span>
    )},
    { header: 'Cabang', key: 'airportId', render: v => <span className="text-gray-600 text-xs">{v}</span> },
    { header: 'Gaji', key: 'gaji', render: v => <span className="text-gray-600 text-xs">{v}</span> },
    { header: 'Status', key: 'status', render: v => <StatusBadge status={v} /> },
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
        <div className="flex items-center gap-3">
          <img src="/rifim-logo.svg" alt="RIFIM" className="h-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Data Staf — {user.role === 'super_admin' ? 'Semua Cabang' : (user.airportId || 'Semua Cabang')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-gray-500 text-sm">Kelola data staf operasional bandara</p>
              {dataSource === 'google_sheets'
                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Google Sheets</span>
                : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Demo Mode</span>
              }
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStaff} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <a href="https://docs.google.com/spreadsheets/d/1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm rounded-lg transition"
          >
            <ExternalLink className="w-4 h-4" /> Sheet
          </a>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition font-medium">
            <Plus className="w-4 h-4" /> Tambah Staf
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau email staf..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {user.role === 'super_admin' ? (
          <select value={filterAirport} onChange={e => setFilterAirport(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Cabang</option>
            {branchList.map(b => {
              const a = AIRPORTS.find(ap => ap.id === b)
              return <option key={b} value={b}>{a ? `${a.code} — ${a.city}` : b}</option>
            })}
          </select>
        ) : (
          <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
            {user.airportId || 'Semua Cabang'}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <DataTable columns={columns} data={filtered} pageSize={8} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Data Staf' : 'Tambah Staf Baru'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama staf" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIK</label>
              <input type="text" value={form.nik} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 digit NIK" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@rifim.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Airport Coordinator">Airport Coordinator</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bandara</label>
              <select value={form.airportId} onChange={e => setForm(f => ({ ...f, airportId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {AIRPORTS.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
              </select>
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
              {editId ? 'Simpan Perubahan' : 'Tambah Staf'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Konfirmasi Hapus" size="sm">
        <div>
          <p className="text-gray-600 text-sm">Hapus staf <strong>{deleteModal?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Batal</button>
            <button onClick={() => handleDelete(deleteModal.id)} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">Hapus</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
