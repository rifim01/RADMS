import React, { useState } from 'react';
import { Power, MapPin, Navigation, Clock, Users, TrendingUp, AlertTriangle, ChevronRight, Car, CheckCircle, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDistance } from '../utils/haversine.js';
import { formatQueueNumber } from '../utils/formatters.js';

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
    queueLoading,
    enterQueue,
    exitQueue,
    completeTrip,
    history,
  } = useApp();

  const [toggling, setToggling] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleToggleOnline = async () => {
    if (toggling) return;
    setToggling(true);
    await toggleOnlineStatus();
    setToggling(false);
  };

  const handleCompleteTrip = async () => {
    setCompleting(true);
    await completeTrip();
    setCompleting(false);
  };

  const today = new Date();
  const todayTrips = history.filter((h) => {
    const tripDate = new Date(h.startTime || h.createdAt || 0);
    return (
      tripDate.getDate() === today.getDate() &&
      tripDate.getMonth() === today.getMonth() &&
      tripDate.getFullYear() === today.getFullYear()
    );
  });

  const todayEarnings = todayTrips
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.fare || 0), 0);

  const activeQueue = queueData.filter((q) => q.status !== 'COMPLETED');
  const myQueueIndex = myQueueEntry
    ? activeQueue.findIndex(e => e.driverId === (driver?.id || driver?.nik))
    : -1;
  const myQueueNumber = myQueueIndex !== -1 ? myQueueIndex + 1 : 0;
  const waitingAhead = Math.max(0, myQueueNumber - 1);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const isOutOfRange = geofenceDistance != null && geofenceDistance > 2000;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Beranda RADMS" />

      <div className="px-4 py-4 space-y-4">
        {/* Greeting Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-4 shadow-md">
          <p className="text-red-100 text-sm">{greeting()},</p>
          <h2 className="text-white font-bold text-xl mt-0.5">{driver?.name?.split(' ')[0]}</h2>
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="w-4 h-4 text-red-200" />
            <span className="text-red-100 text-sm">{airport?.name || driver?.airportId}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Car className="w-4 h-4 text-red-200" />
            <span className="text-red-200 text-sm">{driver?.plateNumber || driver?.vehiclePlate || '-'}</span>
          </div>
        </div>

        {/* Online/Offline Toggle */}
        <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-300 ${
          isOnline ? 'border-green-200' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                Status Layanan
              </p>
              <p className={`text-xl font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {isOnline ? 'Anda siap menerima penumpang' : 'Aktifkan untuk mulai bekerja'}
              </p>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={toggling}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 focus:outline-none ${
                isOnline ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-gray-300'
              } ${toggling ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                isOnline ? 'left-8' : 'left-1'
              }`}>
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <Power className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Geofence Status */}
        <div className={`bg-white rounded-xl border shadow-sm p-3 flex items-center gap-3 ${
          inGeofence ? 'border-blue-200' : isOutOfRange ? 'border-orange-200' : 'border-gray-200'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            inGeofence ? 'bg-blue-50' : isOutOfRange ? 'bg-orange-50' : 'bg-gray-50'
          }`}>
            <Navigation className={`w-5 h-5 ${inGeofence ? 'text-blue-500' : isOutOfRange ? 'text-orange-500' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${inGeofence ? 'text-blue-700' : isOutOfRange ? 'text-orange-700' : 'text-gray-600'}`}>
              {inGeofence ? 'Dalam Area Bandara' : 'Di Luar Area Bandara'}
            </p>
            <p className="text-xs text-gray-400">
              {geofenceDistance != null
                ? `${formatDistance(geofenceDistance)} dari pusat bandara`
                : location ? 'Menghitung jarak...' : 'GPS tidak aktif'}
            </p>
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            inGeofence ? 'bg-blue-50 text-blue-600' : isOutOfRange ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {inGeofence ? 'AKTIF' : 'NONAKTIF'}
          </div>
        </div>

        {/* Queue Status Card */}
        {myQueueEntry ? (
          myQueueEntry.status === 'PICKUP' ? (
            // PICKUP state — show "Selesai Pengantaran"
            <div className="bg-white border border-purple-200 shadow-sm rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Status Perjalanan</p>
                <StatusBadge status="PICKUP" />
              </div>
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Car className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-gray-900 font-bold text-lg">Sedang Mengantarkan</p>
                <p className="text-gray-500 text-sm mt-1">Tekan selesai setelah penumpang diturunkan</p>
              </div>
              <button
                onClick={handleCompleteTrip}
                disabled={completing || queueLoading}
                className="w-full mt-3 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                {completing || queueLoading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                  : <><CheckCircle className="w-5 h-5" /> Selesai Pengantaran</>
                }
              </button>
            </div>
          ) : (
            // WAITING or CALLED state
            <button
              onClick={() => navigate('/queue')}
              className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl p-4 text-left hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Antrian Saya</p>
                <StatusBadge status={myQueueEntry.status} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-2xl font-black">
                    {formatQueueNumber(myQueueNumber)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold">
                    {myQueueEntry.status === 'CALLED' ? 'Anda Dipanggil!' : `Nomor Antrian #${myQueueNumber}`}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {myQueueEntry.status === 'CALLED'
                      ? 'Segera ke zona penjemputan'
                      : waitingAhead > 0
                        ? `${waitingAhead} kendaraan di depan`
                        : 'Anda giliran berikutnya!'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              {myQueueEntry.status === 'CALLED' && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-2 text-center">
                  <p className="text-blue-700 text-xs font-semibold animate-pulse">Tap untuk validasi keberangkatan →</p>
                </div>
              )}
            </button>
          )
        ) : (
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Status Antrian</p>
            {!isOnline ? (
              <p className="text-gray-400 text-sm">Aktifkan status online untuk bergabung antrian</p>
            ) : isOutOfRange ? (
              <div>
                <p className="text-orange-600 text-sm font-medium">Terlalu jauh dari bandara</p>
                <p className="text-gray-400 text-xs mt-0.5">Harus dalam radius 2 km untuk masuk antrian</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-3">Tekan tombol di bawah untuk masuk antrian</p>
                <button
                  onClick={enterQueue}
                  disabled={queueLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  {queueLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mendaftar...</>
                    : <><LogIn className="w-4 h-4" /> Masuk Antrian</>
                  }
                </button>
              </>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">{activeQueue.length}</p>
            <p className="text-gray-400 text-xs">Antrian</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">
              {myQueueEntry ? `~${waitingAhead * 8}m` : '-'}
            </p>
            <p className="text-gray-400 text-xs">Est. Tunggu</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">{driver?.rating ?? '-'}</p>
            <p className="text-gray-400 text-xs">Rating</p>
          </div>
        </div>

        {/* Today's summary */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Hari Ini</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs">Total Perjalanan</p>
              <p className="text-gray-900 font-bold text-xl mt-0.5">{todayTrips.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Pendapatan</p>
              <p className="text-green-600 font-bold text-xl mt-0.5">
                {todayEarnings > 0 ? `Rp ${todayEarnings.toLocaleString('id-ID')}` : 'Rp 0'}
              </p>
            </div>
          </div>
          {todayTrips.length === 0 && (
            <p className="text-gray-300 text-sm mt-2">Belum ada perjalanan hari ini</p>
          )}
        </div>

        {/* Panic button shortcut */}
        <button
          onClick={() => navigate('/panic')}
          className="w-full flex items-center gap-3 bg-white border border-red-200 shadow-sm rounded-xl p-4 hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-red-600 font-semibold text-sm">Tombol Darurat</p>
            <p className="text-gray-400 text-xs">Tekan jika dalam situasi bahaya</p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-300" />
        </button>
      </div>
    </div>
  );
}
