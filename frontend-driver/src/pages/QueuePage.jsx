import React, { useState } from 'react';
import { RefreshCw, ListOrdered, Clock, Users, Info, CheckCircle, X } from 'lucide-react';
import { findStaffById } from '../services/sheetsService.js';
import { recordValidation } from '../services/supabaseService.js';
import Header from '../components/Header.jsx';
import QueueCard from '../components/QueueCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatQueueNumber, formatTime, translateStatus } from '../utils/formatters.js';
import { estimateWaitTime } from '../services/geofence.js';

export default function QueuePage() {
  const { driver } = useAuth();
  const { queueData, myQueueEntry, airport, isOnline, inGeofence } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showValidasi, setShowValidasi] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [staffNama, setStaffNama] = useState('');
  const [validasiLoading, setValidasiLoading] = useState(false);
  const [validasiError, setValidasiError] = useState('');
  const [validasiSuccess, setValidasiSuccess] = useState(false);

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
      const namaStaff = staff.nama.toLowerCase();
      if (!namaStaff.includes(namaInput) && !namaInput.includes(namaStaff.split(' ')[0])) {
        setValidasiError('Nama tidak sesuai dengan ID Staff.');
        setValidasiLoading(false);
        return;
      }
      await recordValidation(driver.id, driver.name, driver.airportId || 'unknown', staff.id, staff.nama);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const activeQueue = queueData.filter((q) => q.status !== 'COMPLETED');
  const waitingCount = queueData.filter((q) => q.status === 'WAITING').length;
  const calledCount = queueData.filter((q) => q.status === 'CALLED').length;
  const waitingAhead = myQueueEntry ? myQueueEntry.queueNumber - 1 : 0;
  const estWait = myQueueEntry ? estimateWaitTime(myQueueEntry.queueNumber) : null;

  const statusColors = {
    WAITING: 'text-yellow-400',
    CALLED: 'text-blue-400',
    PICKUP: 'text-purple-400',
    COMPLETED: 'text-green-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header
        title="Status Antrian"
        rightAction={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* My Queue Card */}
        {myQueueEntry ? (
          <div className="bg-gradient-to-br from-blue-600/25 to-indigo-600/15 border border-blue-500/40 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-blue-300 text-sm font-medium">Posisi Antrian Saya</p>
              <StatusBadge status={myQueueEntry.status} size="md" />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-3xl font-black">
                    {formatQueueNumber(myQueueEntry.queueNumber)}
                  </span>
                </div>
                {myQueueEntry.status === 'CALLED' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
                )}
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-500 text-xs">Di Depan</p>
                    <p className="text-white font-bold text-lg">{waitingAhead}</p>
                    <p className="text-slate-400 text-xs">kendaraan</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Est. Tunggu</p>
                    <p className="text-white font-bold text-lg">
                      {estWait !== null ? `${estWait}m` : '-'}
                    </p>
                    <p className="text-slate-400 text-xs">menit</p>
                  </div>
                </div>
              </div>
            </div>

            {myQueueEntry.status === 'CALLED' && (
              <div className="mt-4 bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-center">
                <p className="text-blue-300 font-semibold animate-pulse">
                  Anda Dipanggil! Segera menuju zona penjemputan.
                </p>
                <button
                  onClick={() => setShowValidasi(true)}
                  className="w-full mt-3 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Validasi Keberangkatan
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Bergabung: {formatTime(myQueueEntry.joinedAt)}</span>
              <span>·</span>
              <span>{myQueueEntry.zone}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 text-center">
            <ListOrdered className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Belum Dalam Antrian</p>
            <p className="text-slate-500 text-sm mt-1">
              {!isOnline
                ? 'Aktifkan status online di Beranda'
                : !inGeofence
                  ? 'Masuki area bandara untuk bergabung antrian'
                  : 'Mendaftarkan ke antrian...'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-bold text-xl">{waitingCount}</p>
            <p className="text-slate-500 text-xs mt-0.5">Menunggu</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-blue-400 font-bold text-xl">{calledCount}</p>
            <p className="text-slate-500 text-xs mt-0.5">Dipanggil</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-xl">{activeQueue.length}</p>
            <p className="text-slate-500 text-xs mt-0.5">Total Aktif</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-slate-800/40 border border-slate-700/30 rounded-xl p-3">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-slate-500 text-xs">
            Antrian otomatis didaftarkan saat Anda masuk area geofence bandara dan status online. Estimasi tunggu berdasarkan rata-rata 8 menit per kendaraan.
          </p>
        </div>

        {/* Queue list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Daftar Antrian ({activeQueue.length})
            </p>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Users className="w-3 h-3" />
              <span>{activeQueue.length} aktif</span>
            </div>
          </div>

          <div className="space-y-2">
            {activeQueue.map((entry) => (
              <QueueCard
                key={entry.id}
                entry={entry}
                isCurrentDriver={entry.driverId === driver?.id}
              />
            ))}

            {activeQueue.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-600">Tidak ada antrian aktif</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showValidasi && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Validasi Keberangkatan</h3>
              <button onClick={() => { setShowValidasi(false); setValidasiError(''); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {validasiSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-bold text-lg">Validasi Berhasil!</p>
                <p className="text-slate-400 text-sm mt-1">Keberangkatan tercatat oleh staff.</p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-4">Tunjukkan layar ini ke Staff. Staff masukkan ID dan Nama untuk validasi.</p>
                <form onSubmit={handleValidasi} className="space-y-3">
                  {validasiError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{validasiError}</div>
                  )}
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">ID Staff</label>
                    <input
                      type="text"
                      value={staffId}
                      onChange={e => setStaffId(e.target.value)}
                      placeholder="Contoh: RIF0125"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Nama Staff</label>
                    <input
                      type="text"
                      value={staffNama}
                      onChange={e => setStaffNama(e.target.value)}
                      placeholder="Nama lengkap staff"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={validasiLoading}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {validasiLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memverifikasi...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Validasi</>
                    )}
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
