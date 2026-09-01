'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Cpu, HardDrive, Clock, ExternalLink, Terminal, AlertTriangle, Hash } from 'lucide-react';
import { BotData } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { BotControls } from './BotControls';

interface BotCardProps {
  bot: BotData;
  onRefresh?: () => void;
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0 || (days === 0 && hours === 0 && minutes < 5)) {
    parts.push(`${secs}s`);
  }
  return parts.slice(0, 2).join(' ');
}

export function BotCard({ bot, onRefresh }: BotCardProps) {
  return (
    <div
      id={`bot-card-${bot.id}`}
      className="group relative flex flex-col justify-between rounded-xl bg-[#111726]/90 border border-[#1E293B] p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:border-purple-500/30 hover:bg-[#141C2E]"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/bots/${bot.id}`}
                  className="font-bold text-white hover:text-purple-400 transition-colors text-base flex items-center gap-1.5"
                >
                  {bot.name}
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </Link>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {bot.description || `Configured in ${bot.path}`}
              </p>
            </div>
          </div>

          <StatusBadge status={bot.status} size="md" />
        </div>

        {/* Crash alert banner */}
        {bot.status === 'crashed' && bot.lastCrashReason && (
          <div className="mt-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 flex items-start gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="overflow-hidden">
              <span className="font-semibold text-rose-200">Crash Detected: </span>
              <span className="font-mono text-[11px] break-all">{bot.lastCrashReason}</span>
              {bot.restartCount > 0 && (
                <div className="mt-1 text-[11px] text-rose-400">
                  Restarts attempted: <span className="font-semibold">{bot.restartCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time telemetry metrics grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3">
          {/* CPU */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Cpu className="w-3 h-3 text-purple-400" />
              <span>CPU</span>
            </div>
            <span className="mt-0.5 text-sm font-semibold font-mono text-white">
              {bot.status === 'online' ? `${bot.cpuUsage}%` : '—'}
            </span>
          </div>

          {/* RAM */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <HardDrive className="w-3 h-3 text-sky-400" />
              <span>RAM</span>
            </div>
            <span className="mt-0.5 text-sm font-semibold font-mono text-white">
              {bot.status === 'online' ? `${bot.ramUsageMB} MB` : '—'}
            </span>
          </div>

          {/* Uptime */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Uptime</span>
            </div>
            <span className="mt-0.5 text-sm font-semibold font-mono text-white">
              {bot.status === 'online' ? formatUptime(bot.uptime) : '—'}
            </span>
          </div>

          {/* PID */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Hash className="w-3 h-3 text-amber-400" />
              <span>PID</span>
            </div>
            <span className="mt-0.5 text-sm font-semibold font-mono text-white">
              {bot.status === 'online' && bot.pid ? bot.pid : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Action Controls & Console Link */}
      <div className="mt-4 pt-3.5 border-t border-[#1E293B] flex items-center justify-between gap-3 flex-wrap">
        <BotControls
          botId={bot.id}
          botName={bot.name}
          status={bot.status}
          compact={true}
          onActionSuccess={() => onRefresh && onRefresh()}
        />

        <div className="flex items-center gap-2">
          <Link
            id={`link-console-${bot.id}`}
            href={`/console?bot=${bot.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs</span>
          </Link>
          <Link
            id={`link-details-${bot.id}`}
            href={`/bots/${bot.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
          >
            <span>Manage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
