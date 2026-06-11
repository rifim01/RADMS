import React from 'react';
import { Bell, Wifi, WifiOff, Signal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import RifimLogo from './RifimLogo.jsx';

export default function Header({ title, showBack = false, rightAction = null }) {
  const navigate = useNavigate();
  const { unreadCount, networkStatus, isOnline } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <RifimLogo className="h-6 w-auto" textColor="white" subtitleColor="rgba(255,255,255,0.6)" />
            </div>
          )}
          <h1 className="text-white font-semibold text-base truncate">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Network status */}
          <div className="flex items-center gap-1">
            {networkStatus ? (
              <Signal className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>

          {/* Online indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isOnline
              ? 'bg-green-500/20 text-green-400'
              : 'bg-slate-600/40 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {/* Notifications bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center px-0.5 font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {rightAction}
        </div>
      </div>
    </header>
  );
}
