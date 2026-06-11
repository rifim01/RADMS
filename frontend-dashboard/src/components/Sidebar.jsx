import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Map, Users, ClipboardList, UserCheck,
  BarChart2, FileText, Building2, Settings, Car, Globe2, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_PERMISSIONS } from '../services/authService'

const NAV_ITEMS = [
  { key: 'national_dashboard', to: '/national-dashboard', label: 'Dashboard Nasional', icon: Globe2, roles: ['super_admin'] },
  { key: 'airport_dashboard', to: '/airport-dashboard', label: 'Dashboard Bandara', icon: LayoutDashboard, roles: ['coordinator', 'staff'] },
  { key: 'drivers', to: '/drivers', label: 'Data Driver', icon: Car, roles: ['super_admin', 'coordinator', 'staff'] },
  { key: 'drivers', to: '/driver-tracking', label: 'Pelacakan Driver', icon: Map, roles: ['super_admin', 'coordinator', 'staff'] },
  { key: 'queue', to: '/queue', label: 'Manajemen Antrian', icon: ClipboardList, roles: ['super_admin', 'coordinator', 'staff'] },
  { key: 'attendance', to: '/attendance', label: 'Kehadiran Staf', icon: UserCheck, roles: ['super_admin', 'coordinator', 'staff'] },
  { key: 'kpi', to: '/kpi', label: 'Analitik KPI', icon: BarChart2, roles: ['super_admin', 'coordinator'] },
  { key: 'reporting', to: '/reporting', label: 'Laporan', icon: FileText, roles: ['super_admin', 'coordinator'] },
  { key: 'staff', to: '/staff', label: 'Data Staf', icon: Users, roles: ['super_admin'] },
  { key: 'airports', to: '/airports', label: 'Data Bandara', icon: Building2, roles: ['super_admin'] },
  { key: 'settings', to: '/settings', label: 'Pengaturan', icon: Settings, roles: ['super_admin', 'coordinator', 'staff'] },
]

export default function Sidebar({ collapsed, onClose }) {
  const { user } = useAuth()
  const perms = ROLE_PERMISSIONS[user?.role] || []

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role) && perms.includes(item.key)
  )

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          bg-[#1e293b] text-white transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img src="/rifim-logo.svg" alt="RIFIM" className="h-8 flex-shrink-0 bg-white rounded px-1" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-white text-xs leading-tight">Airport Driver Management</p>
              <p className="text-[10px] text-slate-400 leading-tight">RADMS v1.0</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.avatar}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
