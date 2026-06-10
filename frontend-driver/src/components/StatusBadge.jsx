import React from 'react';
import { translateStatus } from '../utils/formatters.js';

const statusConfig = {
  WAITING: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    dot: 'bg-yellow-400',
    pulse: false,
  },
  CALLED: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/40',
    dot: 'bg-blue-400',
    pulse: true,
  },
  PICKUP: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    dot: 'bg-purple-400',
    pulse: true,
  },
  COMPLETED: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/40',
    dot: 'bg-green-400',
    pulse: false,
  },
  CANCELLED: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/40',
    dot: 'bg-red-400',
    pulse: false,
  },
  ONLINE: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/40',
    dot: 'bg-green-400',
    pulse: true,
  },
  OFFLINE: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/40',
    dot: 'bg-slate-400',
    pulse: false,
  },
};

export default function StatusBadge({ status, size = 'sm', showDot = true, className = '' }) {
  const config = statusConfig[status] || statusConfig.OFFLINE;
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${config.bg} ${config.text} ${config.border}
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
      )}
      {translateStatus(status)}
    </span>
  );
}
