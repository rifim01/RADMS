import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListOrdered, Map, Bell, History, User } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const navItems = [
  { to: '/home', icon: Home, label: 'Beranda' },
  { to: '/queue', icon: ListOrdered, label: 'Antrian' },
  { to: '/map', icon: Map, label: 'Peta' },
  { to: '/notifications', icon: Bell, label: 'Notifikasi', badge: true },
  { to: '/history', icon: History, label: 'Riwayat' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  const { unreadCount } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 safe-area-inset-bottom">
      <div className="flex items-stretch max-w-screen-sm mx-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 px-1 gap-0.5 min-h-[60px] transition-colors relative ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {badge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center px-0.5 font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-blue-400' : ''}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
