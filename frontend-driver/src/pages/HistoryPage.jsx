import React, { useState } from 'react';
import { MapPin, Clock, DollarSign, Star, Car, Filter, TrendingUp, Calendar } from 'lucide-react';
import Header from '../components/Header.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatDateShort, formatTime, formatDuration, formatQueueNumber } from '../utils/formatters.js';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function HistoryPage() {
  const { history } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? history : history.filter((h) => h.status === filter);

  const totalCompleted = history.filter((h) => h.status === 'COMPLETED');
  const totalEarnings = totalCompleted.reduce((sum, t) => sum + (t.fare || 0), 0);
  const avgRating = totalCompleted.filter((t) => t.rating)
    .reduce((sum, t, _, arr) => sum + t.rating / arr.length, 0);

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3 h-3 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Riwayat Perjalanan" />

      <div className="px-4 py-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <Car className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">{totalCompleted.length}</p>
            <p className="text-gray-400 text-xs">Perjalanan</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-green-600 font-bold text-sm">
              {(totalEarnings / 1000).toFixed(0)}K
            </p>
            <p className="text-gray-400 text-xs">Pendapatan</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-gray-900 font-bold text-lg">
              {avgRating > 0 ? avgRating.toFixed(1) : '-'}
            </p>
            <p className="text-gray-400 text-xs">Rata-rata</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* History list */}
        <div className="space-y-3">
          {filtered.map((trip) => (
            <div key={trip.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-bold">
                      #{formatQueueNumber(trip.queueNumber || '?')}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm font-semibold">{trip.passengerName || trip.driverName || 'Perjalanan'}</p>
                    <p className="text-gray-400 text-xs">{formatDateShort(trip.startTime)}</p>
                  </div>
                </div>
                <StatusBadge status={trip.status} size="sm" />
              </div>

              {/* Route */}
              {(trip.pickupLocation || trip.dropoffLocation) && (
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed flex-1">{trip.pickupLocation || trip.branchId}</p>
                  </div>
                  <div className="ml-2.5 w-px h-3 bg-gray-200" />
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed flex-1">{trip.dropoffLocation || 'Tujuan penumpang'}</p>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                {trip.duration && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(trip.duration)}</span>
                  </div>
                )}
                {trip.distance && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trip.distance} km</span>
                  </div>
                )}
                {trip.status === 'COMPLETED' && trip.fare && (
                  <div className="ml-auto flex items-center gap-2">
                    {renderStars(trip.rating)}
                    <span className="text-green-600 font-semibold text-sm">
                      Rp {(trip.fare || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {trip.status === 'CANCELLED' && (
                  <div className="ml-auto">
                    <span className="text-gray-400 text-xs">{trip.cancelReason || 'Dibatalkan'}</span>
                  </div>
                )}
                {trip.status === 'COMPLETED' && !trip.fare && (
                  <div className="ml-auto">
                    <span className="text-green-600 text-xs font-medium">Selesai</span>
                  </div>
                )}
              </div>

              {trip.status === 'COMPLETED' && (trip.paymentMethod || trip.startTime) && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-gray-400 text-xs">
                    {formatTime(trip.startTime)}{trip.endTime ? ` - ${formatTime(trip.endTime)}` : ''}
                  </span>
                  {trip.paymentMethod && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {trip.paymentMethod}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Tidak ada riwayat</p>
              <p className="text-gray-400 text-sm mt-1">
                {filter !== 'all' ? `Tidak ada perjalanan ${FILTER_OPTIONS.find(f => f.value === filter)?.label}` : 'Riwayat perjalanan akan muncul di sini'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
