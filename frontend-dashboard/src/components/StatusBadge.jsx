export default function StatusBadge({ status }) {
  const configs = {
    // Queue statuses
    WAITING: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    CALLED: { label: 'Dipanggil', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
    PICKUP: { label: 'Penjemputan', className: 'bg-green-100 text-green-800 border border-green-200' },
    COMPLETED: { label: 'Selesai', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
    REMOVED: { label: 'Dihapus', className: 'bg-red-100 text-red-700 border border-red-200' },

    // Driver statuses
    online: { label: 'Online', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    offline: { label: 'Offline', className: 'bg-slate-100 text-slate-600 border border-slate-200' },

    // Staff statuses
    active: { label: 'Aktif', className: 'bg-green-100 text-green-800 border border-green-200' },
    inactive: { label: 'Tidak Aktif', className: 'bg-red-100 text-red-700 border border-red-200' },

    // Attendance statuses
    hadir: { label: 'Hadir', className: 'bg-green-100 text-green-800 border border-green-200' },
    terlambat: { label: 'Terlambat', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    tidak_hadir: { label: 'Tidak Hadir', className: 'bg-red-100 text-red-700 border border-red-200' },
  }

  const cfg = configs[status] || { label: status, className: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
