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
  const totalEarnings = totalCompleted.reduce((sum, t) => sum + t.fare, 0);
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
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header title="Riwayat Perjalanan" />

      <div className="px-4 py-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Car className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{totalCompleted.length}</p>
            <p className="text-slate-500 text-xs">Perjalanan</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-green-400 font-bold text-sm">
              {(totalEarnings / 1000).toFixed(0)}K
            </p>
            <p className="text-slate-500 text-xs">Pendapatan</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">
              {avgRating > 0 ? avgRating.toFixed(1) : '-'}
            </p>
            <p className="text-slate-500 text-xs">Rata-rata</p>
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* History list */}
        <div className="space-y-3">
          {filtered.map((trip) => (
            <div
              key={trip.id}
              className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center">
                    <span className="text-slate-300 text-xs font-bold">
                      #{formatQueueNumber(trip.queueNumber)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{trip.passengerName}</p>
                    <p className="text-slate-500 text-xs">{formatDateShort(trip.startTime)}</p>
                  </div>
                </div>
                <StatusBadge status={trip.status} size="sm" />
              </div>

              {/* Route */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed flex-1">{trip.pickupLocation}</p>
                </div>
                <div className="ml-2.5 w-px h-3 bg-slate-600" />
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed flex-1">{trip.dropoffLocation}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(trip.duration)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{trip.distance} km</span>
                </div>
                {trip.status === 'COMPLETED' && (
                  <div className="ml-auto flex items-center gap-2">
                    {renderStars(trip.rating)}
                    <span className="text-green-400 font-semibold text-sm">
                      Rp {trip.fare.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {trip.status === 'CANCELLED' && (
                  <div className="ml-auto">
                    <span className="text-slate-500 text-xs">{trip.cancelReason || 'Dibatalkan'}</span>
                  </div>
                )}
              </div>

              {/* Payment method */}
              {trip.status === 'COMPLETED' && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-600 text-xs">
                    {formatTime(trip.startTime)} - {formatTime(trip.endTime)}
                  </span>
                  <span className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                    {trip.paymentMethod}
                  </span>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Tidak ada riwayat</p>
              <p className="text-slate-600 text-sm mt-1">
                {filter !== 'all' ? `Tidak ada perjalanan ${FILTER_OPTIONS.find(f => f.value === filter)?.label}` : 'Riwayat perjalanan akan muncul di sini'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
