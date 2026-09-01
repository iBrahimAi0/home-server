'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0E17]/80 backdrop-blur-md border-b border-[#1A2337] px-6 py-4"
    >
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          {title}
        </h1>
        {subtitle && <p className="text-xs md:text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Real-time Server Health Status */}
        {crashedCount > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{crashedCount} Bot Crashed</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All Systems Operational</span>
          </div>
        )}

        {/* Online Bots Count Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#131B2E] border border-[#1E293B] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span>
            Bots:{' '}
            <strong className="text-white font-mono">
              {onlineCount}/{bots.length || 3} Online
            </strong>
          </span>
        </div>

        {/* Live Clock */}
        {timeStr && (
          <div className="hidden lg:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono text-slate-400 bg-[#131B2E] border border-[#1E293B]">
            {timeStr}
          </div>
        )}

        {/* Console Shortcut */}
        <Link
          id="header-link-console"
          href="/console"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>Console</span>
        </Link>

        {/* Refresh button */}
        {onRefresh && (
          <button
            id="btn-header-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh metrics and bots"
            className="p-2 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1E293B] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
}
