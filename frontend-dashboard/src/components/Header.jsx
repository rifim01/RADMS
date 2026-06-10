import { useState } from 'react'
import { Bell, LogOut, Menu, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../services/authService'

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  const notifications = [
    { id: 1, msg: 'Driver Deni Prasetyo telah check-in', time: '5 mnt lalu', read: false },
    { id: 2, msg: 'Antrian #12 di Soekarno-Hatta selesai', time: '12 mnt lalu', read: false },
    { id: 3, msg: 'Laporan harian siap diunduh', time: '1 jam lalu', read: true },
  ]
  const unreadCount = notifications.filter(n => !n.read).length

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">RIFIM Airport Driver Management System</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowDropdown(false) }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 fade-in">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-sm">Notifikasi</span>
                <span className="text-xs text-blue-600 cursor-pointer hover:underline">Tandai semua dibaca</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm text-gray-700">{n.msg}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowDropdown(!showDropdown); setShowNotif(false) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.avatar || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-none">{user?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 fade-in overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { navigate('/settings'); setShowDropdown(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <User className="w-4 h-4" /> Profil & Pengaturan
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
