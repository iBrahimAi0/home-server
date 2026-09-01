'use client';

import React from 'react';
import { BotStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: BotStatus | 'online' | 'offline' | 'starting' | 'stopping' | 'crashed' | 'degraded';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function StatusBadge({ status, size = 'md', showPulse = true }: StatusBadgeProps) {
  const configs: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
    online: {
      label: 'Online',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20'
    },
    offline: {
      label: 'Offline',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
      border: 'border-slate-500/20'
    },
    starting: {
      label: 'Starting',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20'
    },
    stopping: {
      label: 'Stopping',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20'
    },
    crashed: {
      label: 'Crashed',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      border: 'border-rose-500/20'
    },
    degraded: {
      label: 'Degraded',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20'
    }
  };

  const current = configs[status] || configs.offline;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-medium gap-1.5',
    md: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1 text-xs font-semibold gap-2'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2 h-2'
  };

  return (
    <span
      id={`status-badge-${status}`}
      className={`inline-flex items-center rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]} select-none font-mono`}
    >
      <span className="relative flex items-center justify-center">
        {showPulse && (status === 'online' || status === 'starting') && (
          <span className={`absolute inline-flex h-full w-full rounded-full animate-ping opacity-60 ${current.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full ${current.dot} ${dotSizes[size]}`} />
      </span>
      <span>{current.label}</span>
    </span>
  );
}
