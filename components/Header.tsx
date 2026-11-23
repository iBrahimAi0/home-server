'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Terminal, CheckCircle2, AlertTriangle, Bot } from 'lucide-react';
import { BotData, SystemStatus } from '@/lib/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  bots?: BotData[];
  systemStatus?: SystemStatus | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  title,
  subtitle,
  bots = [],
  systemStatus,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const onlineCount = bots.filter((b) => b.status === 'online').length;
  const crashedCount = bots.filter((b) => b.status === 'crashed').length;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080B10]/80 backdrop-blur-xl border-b border-white/[0.06] px-6 py-3.5 transition-colors"
    >
      <div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Real-time Server Health Indicator */}
        {crashedCount > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{crashedCount} Crashed</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Host Operational</span>
          </div>
        )}

        {/* Active Bots Count */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Fleet: <strong className="text-white font-mono">{onlineCount}/{bots.length}</strong>
          </span>
        </div>

        {/* Live Node Time */}
        {timeStr && (
          <div className="hidden lg:inline-flex items-center px-3 py-1 rounded-full text-xs font-mono text-slate-400 bg-white/[0.03] border border-white/[0.06]">
            {timeStr}
          </div>
        )}

        {/* Console Link */}
        <Link
          id="header-link-console"
          href="/console"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.08] hover:border-indigo-500/30 transition-all"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Console</span>
        </Link>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            id="btn-header-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh metrics"
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
}
