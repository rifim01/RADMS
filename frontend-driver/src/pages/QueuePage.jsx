import React, { useState } from 'react';
import { RefreshCw, ListOrdered, Clock, Users, Info, CheckCircle, X, LogIn, LogOut, Car, MapPin } from 'lucide-react';
import { findStaffById } from '../services/sheetsService.js';
import { recordValidation } from '../services/firebaseService.js';
import Header from '../components/Header.jsx';
import QueueCard from '../components/QueueCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatQueueNumber, formatTime, translateStatus } from '../utils/formatters.js';
import { estimateWaitTime } from '../services/geofence.js';

export default function QueuePage() {
  const { driver } = useAuth();
  const {
    queueData, myQueueEntry, airport, isOnline, inGeofence,
    geofenceDistance, enterQueue, exitQueue, pickupQueue, completeTrip, queueLoading,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showValidasi, setShowValidasi] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [staffNama, setStaffNama] = useState('');
  const [validasiLoading, setValidasiLoading] = useState(false);
  const [validasiError, setValidasiError] = useState('');
  const [validasiSuccess, setValidasiSuccess] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleValidasi = async (e) => {
    e.preventDefault();
    setValidasiError('');
    setValidasiLoading(true);
    try {
      const staff = await findStaffById(staffId.trim());
      if (!staff) {
        setValidasiError('ID Staff tidak ditemukan di sistem RIFIM.');
        setValidasiLoading(false);
        return;
      }
      const namaInput = staffNama.trim().toLowerCase();
      const namaStaff = (staff.nama || '').toLowerCase();
      if (!namaStaff.includes(namaInput) && !namaInput.includes(namaStaff.split(' ')[0])) {
        setValidasiError('Nama tidak sesuai dengan ID Staff.');
        setValidasiLoading(false);
        return;
      }
      // Record validation AND mark as PICKUP
      await recordValidation(driver.id, driver.name, driver.airportId || 'unknown', staff.id, staff.nama);
      await pickupQueue();
      setValidasiSuccess(true);
      setTimeout(() => {
        setShowValidasi(false);
        setValidasiSuccess(false);
        setStaffId('');
        setStaffNama('');
      }, 2000);
    } catch {
      setValidasiError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setValidasiLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    setCompleting(true);
    await completeTrip();
    setCompleting(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const activeQueue = queueData.filter((q) => q.status !== 'COMPLETED');
  const waitingCount = queueData.filter((q) => q.status === 'WAITING').length;
  const calledCount = queueData.filter((q) => q.status === 'CALLED').length;
  const myQueueIndex = myQueueEntry
    ? activeQueue.findIndex(e => e.driverId === (driver?.id || driver?.nik))
    : -1;
  const myQueueNumber = myQueueIndex !== -1 ? myQueueIndex + 1 : 1;
  const waitingAhead = Math.max(0, myQueueNumber - 1);
  const estWait = myQueueEntry ? estimateWaitTime(myQueueNumber) : null;
  const joinedAtMs = myQueueEntry?.joinedAt;
  const joinedTimeStr = joinedAtMs ? formatTime(new Date(joinedAtMs)) : '--:--';

  const isOutOfRange = geofenceDistance != null && geofenceDistance > 2000;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        title="Status Antrian"
        rightAction={
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* My Queue Card */}
        {myQueueEntry ? (
          myQueueEntry.status === 'PICKUP' ? (
            // PICKUP — Selesai Pengantaran
            <div className="bg-white border border-purple-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 text-sm font-medium">Status Perjalanan</p>
                <StatusBadge status="PICKUP" size="md" />
              </div>
              <div className="text-center py-2">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Car className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-gray-900 font-bold text-lg">Sedang Mengantarkan Penumpang</p>
                <p className="text-gray-500 text-sm mt-1">Tekan selesai setelah penumpang diturunkan</p>
              </div>
              <button
                onClick={handleCompleteTrip}
                disabled={completing || queueLoading}
                className="w-full mt-4 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                {completing || queueLoading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                  : <><CheckCircle className="w-5 h-5" /> Selesai Pengantaran</>
                }
              </button>
              <p className="text-center text-gray-400 text-xs mt-3">
                Bergabung: {joinedTimeStr}
              </p>
            </div>
          ) : (
            // WAITING or CALLED
            <div className={`rounded-2xl p-5 ${
              myQueueEntry.status === 'CALLED'
                ? 'bg-blue-50 border border-blue-200 shadow-sm'
                : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm font-medium ${myQueueEntry.status === 'CALLED' ? 'text-blue-700' : 'text-gray-500'}`}>
                  Posisi Antrian Saya
                </p>
                <StatusBadge status={myQueueEntry.status} size="md" />
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-black">
                      {formatQueueNumber(myQueueNumber)}
                    </span>
                  </div>
                  {myQueueEntry.status === 'CALLED' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 text-xs">Di Depan</p>
                      <p className="text-gray-900 font-bold text-lg">{waitingAhead}</p>
                      <p className="text-gray-400 text-xs">kendaraan</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Est. Tunggu</p>
                      <p className="text-gray-900 font-bold text-lg">
                        {estWait !== null ? `${estWait}m` : '-'}
                      </p>
                      <p className="text-gray-400 text-xs">menit</p>
                    </div>
                  </div>
                </div>
              </div>

              {myQueueEntry.status === 'CALLED' && (
                <div className="mt-4 bg-blue-100 border border-blue-300 rounded-xl p-3 text-center">
                  <p className="text-blue-800 font-semibold animate-pulse">
                    Anda Dipanggil! Segera menuju zona penjemputan.
                  </p>
                  <button
                    onClick={() => setShowValidasi(true)}
                    className="w-full mt-3 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Konfirmasi Penjemputan
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Bergabung: {joinedTimeStr}</span>
                </div>
                {myQueueEntry.status === 'WAITING' && (
                  <button
                    onClick={exitQueue}
                    disabled={queueLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium rounded-lg transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Keluar Antrian
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 text-center">
            <ListOrdered className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Belum Dalam Antrian</p>
            {!isOnline ? (
              <p className="text-gray-400 text-sm mt-1">Aktifkan status online di Beranda terlebih dahulu</p>
            ) : isOutOfRange ? (
              <div className="mt-2">
                <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm font-medium">Di Luar Radius Bandara</p>
                </div>
                <p className="text-gray-400 text-xs">
                  Anda {geofenceDistance != null ? `${Math.round(geofenceDistance)}m` : '-'} dari bandara.
                  Harus dalam 2 km untuk masuk antrian.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mt-1 mb-4">Tekan tombol di bawah untuk masuk antrian</p>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <p className="text-yellow-500 font-bold text-xl">{waitingCount}</p>
            <p className="text-gray-400 text-xs mt-0.5">Menunggu</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <p className="text-blue-500 font-bold text-xl">{calledCount}</p>
            <p className="text-gray-400 text-xs mt-0.5">Dipanggil</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <p className="text-gray-900 font-bold text-xl">{activeQueue.length}</p>
            <p className="text-gray-400 text-xs mt-0.5">Total Aktif</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-600 text-xs">
            Antrian tersedia dalam radius 2 km dari bandara. Estimasi tunggu: rata-rata 8 menit per kendaraan.
          </p>
        </div>

        {/* Queue list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Daftar Antrian ({activeQueue.length})
            </p>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Users className="w-3 h-3" />
              <span>{activeQueue.length} aktif</span>
            </div>
          </div>

          <div className="space-y-2">
            {activeQueue.map((entry) => (
              <QueueCard
                key={entry.id || entry.driverId}
                entry={entry}
                isCurrentDriver={entry.driverId === driver?.id}
              />
            ))}
            {activeQueue.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">Tidak ada antrian aktif</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Konfirmasi Penjemputan Modal */}
      {showValidasi && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-lg">Konfirmasi Penjemputan</h3>
              <button onClick={() => { setShowValidasi(false); setValidasiError(''); }} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {validasiSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-green-600 font-bold text-lg">Konfirmasi Berhasil!</p>
                <p className="text-gray-500 text-sm mt-1">Status diperbarui ke Sedang Mengantarkan.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-4">Staff masukkan ID dan Nama untuk konfirmasi penjemputan penumpang.</p>
                <form onSubmit={handleValidasi} className="space-y-3">
                  {validasiError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{validasiError}</div>
                  )}
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block font-medium">ID Staff</label>
                    <input
                      type="text"
                      value={staffId}
                      onChange={e => setStaffId(e.target.value)}
                      placeholder="Contoh: RIF0125"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block font-medium">Nama Staff</label>
                    <input
                      type="text"
                      value={staffNama}
                      onChange={e => setStaffNama(e.target.value)}
                      placeholder="Nama lengkap staff"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={validasiLoading}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {validasiLoading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memverifikasi...</>
                      : <><CheckCircle className="w-4 h-4" /> Konfirmasi</>
                    }
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
