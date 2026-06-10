import React from 'react';
import {
  Bell, MapPin, CheckCircle, Star, CloudRain, User, Info,
  AlertTriangle, ChevronRight, CheckCheck
} from 'lucide-react';
import Header from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatRelativeTime } from '../utils/formatters.js';

const notifIconMap = {
  'bell': Bell,
  'map-pin': MapPin,
  'check-circle': CheckCircle,
  'star': Star,
  'cloud-rain': CloudRain,
  'user': User,
  'info': Info,
  'alert-triangle': AlertTriangle,
};

const notifTypeConfig = {
  CALLED: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  GEOFENCE: { color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
  ANNOUNCEMENT: { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-600/30' },
  COMPLETED: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  RATING: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  WEATHER: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  PASSENGER: { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  PANIC: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  STATUS: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  SYSTEM: { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-600/30' },
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const handleNotifClick = (notif) => {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
  };

  const NotifItem = ({ notif }) => {
    const IconComponent = notifIconMap[notif.icon] || Bell;
    const typeConfig = notifTypeConfig[notif.type] || notifTypeConfig.SYSTEM;

    return (
      <button
        onClick={() => handleNotifClick(notif)}
        className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
          !notif.read
            ? `${typeConfig.bg} ${typeConfig.border} shadow-sm`
            : 'bg-slate-800/30 border-slate-700/30 opacity-70'
        }`}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${typeConfig.bg}`}>
          <IconComponent className={`w-5 h-5 ${typeConfig.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-sm leading-snug ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
              {notif.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!notif.read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{notif.message}</p>
          <p className="text-slate-600 text-xs mt-2">{formatRelativeTime(notif.createdAt)}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header
        title="Notifikasi"
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Baca Semua
            </button>
          ) : null
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Unread section */}
        {unread.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Belum Dibaca
              </p>
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unread.length}
              </span>
            </div>
            <div className="space-y-2">
              {unread.map((notif) => (
                <NotifItem key={notif.id} notif={notif} />
              ))}
            </div>
          </div>
        )}

        {/* Read section */}
        {read.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">
              Sudah Dibaca
            </p>
            <div className="space-y-2">
              {read.map((notif) => (
                <NotifItem key={notif.id} notif={notif} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Tidak ada notifikasi</p>
            <p className="text-slate-600 text-sm mt-1">Notifikasi baru akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  );
}
