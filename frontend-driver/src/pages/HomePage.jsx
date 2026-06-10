import React, { useState } from 'react';
import { Power, MapPin, Navigation, Clock, Users, TrendingUp, AlertTriangle, ChevronRight, Car } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDistance } from '../utils/haversine.js';
import { formatQueueNumber, formatRelativeTime } from '../utils/formatters.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const {
    isOnline,
    toggleOnlineStatus,
    location,
    inGeofence,
    geofenceDistance,
    airport,
    queueData,
    myQueueEntry,
    history,
  } = useApp();

  const [toggling, setToggling] = useState(false);

  const handleToggleOnline = async () => {
    if (toggling) return;
    setToggling(true);
    await toggleOnlineStatus();
    setToggling(false);
  };

  const todayTrips = history.filter((h) => {
    const today = new Date();
    const tripDate = new Date(h.startTime);
    return (
      tripDate.getDate() === today.getDate() &&
      tripDate.getMonth() === today.getMonth() &&
      tripDate.getFullYear() === today.getFullYear()
    );
  });

  const todayEarnings = todayTrips
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.fare, 0);

  const onlineCount = queueData.filter((q) => q.status !== 'COMPLETED').length;
  const waitingAhead = myQueueEntry ? myQueueEntry.queueNumber - 1 : 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header title="Beranda RADMS" />

      <div className="px-4 py-4 space-y-4">
        {/* Greeting Card */}
        <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-blue-300 text-sm">{greeting()},</p>
          <h2 className="text-white font-bold text-xl mt-0.5">{driver?.name?.split(' ')[0]}</h2>
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 text-sm">{airport?.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Car className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm">{driver?.vehiclePlate} · {driver?.vehicleModel}</span>
          </div>
        </div>

        {/* Online/Offline Toggle */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 ${
          isOnline
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-slate-800/60 border-slate-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                Status Layanan
              </p>
              <p className={`text-xl font-bold ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {isOnline
                  ? 'Anda siap menerima penumpang'
                  : 'Aktifkan untuk mulai bekerja'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={handleToggleOnline}
              disabled={toggling}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 focus:outline-none ${
                isOnline ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-slate-600'
              } ${toggling ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                  isOnline ? 'left-8' : 'left-1'
                }`}
              >
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <Power className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-slate-400'}`} />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Geofence Status */}
        <div className={`rounded-xl border p-3 flex items-center gap-3 ${
          inGeofence
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-slate-800/60 border-slate-700/50'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            inGeofence ? 'bg-blue-500/20' : 'bg-slate-700/50'
          }`}>
            <Navigation className={`w-5 h-5 ${inGeofence ? 'text-blue-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${inGeofence ? 'text-blue-300' : 'text-slate-400'}`}>
              {inGeofence ? 'Dalam Area Bandara' : 'Di Luar Area Bandara'}
            </p>
            <p className="text-xs text-slate-500">
              {geofenceDistance != null
                ? `${formatDistance(geofenceDistance)} dari pusat bandara`
                : location
                  ? 'Menghitung jarak...'
                  : 'GPS tidak aktif'}
            </p>
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            inGeofence ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
          }`}>
            {inGeofence ? 'AKTIF' : 'NONAKTIF'}
          </div>
        </div>

        {/* Queue Status Card */}
        {myQueueEntry ? (
          <button
            onClick={() => navigate('/queue')}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-left hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Antrian Saya</p>
              <StatusBadge status={myQueueEntry.status} />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-black">
                  {formatQueueNumber(myQueueEntry.queueNumber)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Nomor Antrian #{myQueueEntry.queueNumber}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {waitingAhead > 0
                    ? `${waitingAhead} kendaraan di depan`
                    : 'Anda giliran berikutnya!'}
                </p>
                <p className="text-slate-500 text-xs mt-1">{myQueueEntry.zone}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </button>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-slate-500 text-sm">
              {isOnline
                ? inGeofence
                  ? 'Mendaftar antrian...'
                  : 'Masuki area bandara untuk bergabung antrian'
                : 'Aktifkan status online untuk bergabung antrian'}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{onlineCount}</p>
            <p className="text-slate-500 text-xs">Antrian</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">
              {myQueueEntry ? `~${(waitingAhead) * 8}m` : '-'}
            </p>
            <p className="text-slate-500 text-xs">Est. Tunggu</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{driver?.rating ?? '-'}</p>
            <p className="text-slate-500 text-xs">Rating</p>
          </div>
        </div>

        {/* Today's summary */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Hari Ini</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs">Total Perjalanan</p>
              <p className="text-white font-bold text-xl mt-0.5">{todayTrips.length}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Total Pendapatan</p>
              <p className="text-green-400 font-bold text-xl mt-0.5">
                {todayEarnings > 0
                  ? `Rp ${todayEarnings.toLocaleString('id-ID')}`
                  : 'Rp 0'}
              </p>
            </div>
          </div>
          {todayTrips.length === 0 && (
            <p className="text-slate-600 text-sm mt-2">Belum ada perjalanan hari ini</p>
          )}
        </div>

        {/* Panic button shortcut */}
        <button
          onClick={() => navigate('/panic')}
          className="w-full flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 hover:bg-red-500/15 transition-colors"
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-red-400 font-semibold text-sm">Tombol Darurat</p>
            <p className="text-slate-500 text-xs">Tekan jika dalam situasi bahaya</p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-500/50" />
        </button>
      </div>
    </div>
  );
}
