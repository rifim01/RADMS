import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, ListOrdered, Map, Bell, History, User, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import RifimLogo from './RifimLogo.jsx'
import BottomNav from './BottomNav.jsx'

const navItems = [
  { to: '/home', icon: Home, label: 'Beranda' },
  { to: '/queue', icon: ListOrdered, label: 'Antrian' },
  { to: '/map', icon: Map, label: 'Peta' },
  { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true },
  { to: '/history', icon: History, label: 'Riwayat' },
  { to: '/profile', icon: User, label: 'Profil' },
]

export default function AppShell({ children }) {
  const { unreadCount } = useApp()
  const { driver, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-700/50">
        <div className="p-5 border-b border-slate-700/50">
          <RifimLogo className="h-10 w-auto" textColor="white" subtitleColor="rgba(255,255,255,0.5)" />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                  isActive ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center px-0.5 font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {driver?.name?.[0] || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{driver?.name || 'Driver'}</p>
              <p className="text-slate-500 text-xs truncate">{driver?.airportId || '-'}</p>
            </div>
          </div>
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 lg:min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
