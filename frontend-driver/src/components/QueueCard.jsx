import React from 'react';
import { Car, Clock, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { formatQueueNumber, formatRelativeTime } from '../utils/formatters.js';

export default function QueueCard({ entry, isCurrentDriver = false }) {
  return (
    <div
      className={`
        rounded-xl p-4 border transition-all
        ${isCurrentDriver
          ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
          : 'bg-slate-800/60 border-slate-700/50'
        }
      `}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Queue Number */}
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
          ${isCurrentDriver
            ? 'bg-blue-500 text-white'
            : 'bg-slate-700 text-slate-300'
          }
        `}>
          {formatQueueNumber(entry.queueNumber)}
        </div>

        {/* Driver Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold text-sm truncate ${isCurrentDriver ? 'text-white' : 'text-slate-200'}`}>
              {isCurrentDriver ? `${entry.name} (Anda)` : entry.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" />
              {entry.vehiclePlate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(entry.joinedAt)}
            </span>
          </div>
          {entry.zone && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{entry.zone}</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <StatusBadge status={entry.status} size="sm" />
        </div>
      </div>
    </div>
  );
}
