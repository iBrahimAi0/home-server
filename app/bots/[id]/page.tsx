'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  ArrowLeft, 
  Cpu, 
  HardDrive, 
  Clock, 
  Hash, 
  Folder, 
  Terminal as TerminalIcon, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw,
  FolderOpen,
  Code,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { BotData, LogEntry, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { BotControls } from '@/components/BotControls';
import { Terminal } from '@/components/Terminal';

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export default function BotDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const botId = resolvedParams.id;

  const [bot, setBot] = useState<BotData | null>(null);
  const [allBots, setAllBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [botData, botsList, sys] = await Promise.all([
          api.getBot(botId).catch(() => null),
          api.getBots().catch(() => []),
          api.getSystemStatus().catch(() => null),
        ]);

        if (!isMounted) return;

        if (!botData) {
          setError(`Bot with ID "${botId}" was not found.`);
        } else {
          setBot(botData);
          setError(null);
        }
        setAllBots(botsList);
        if (sys) setSystemStatus(sys);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load bot';
        setError(msg);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

    const unsubStatus = realtime.on<BotData>('bot_status_changed', (updatedBot) => {
      if (!isMounted) return;
      if (updatedBot.id === botId) {
        setBot(updatedBot);
      }
      setAllBots((prev) => prev.map((b) => (b.id === updatedBot.id ? updatedBot : b)));
    });

    const unsubMetrics = realtime.on<BotData[]>('bots_metrics_update', (updatedBots) => {
      if (!isMounted) return;
      setAllBots(updatedBots);
      const target = updatedBots.find((b) => b.id === botId);
      if (target) {
        setBot(target);
      }
    });

    const unsubSys = realtime.on<SystemStatusType>('system_metrics_update', (status) => {
      if (isMounted) setSystemStatus(status);
    });

    return () => {
      isMounted = false;
      unsubStatus();
      unsubMetrics();
      unsubSys();
    };
  }, [botId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [botData, botsList, sys] = await Promise.all([
        api.getBot(botId).catch(() => null),
        api.getBots().catch(() => []),
        api.getSystemStatus().catch(() => null),
      ]);
      if (botData) setBot(botData);
      setAllBots(botsList);
      if (sys) setSystemStatus(sys);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title={bot ? bot.name : 'Bot Details'}
          subtitle={`Process inspector and logs for ${botId}`}
          bots={allBots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link
              href="/bots"
              className="inline-flex items-center gap-1 hover:text-purple-400 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Bots</span>
            </Link>
            <span>/</span>
            <span className="text-white font-semibold font-mono">{botId}</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-32 rounded-xl bg-[#111726]/60 border border-[#1E293B] animate-pulse" />
              <div className="h-64 rounded-xl bg-[#111726]/60 border border-[#1E293B] animate-pulse" />
            </div>
          ) : error || !bot ? (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Bot Not Found</h3>
              <p className="text-xs text-rose-300 mt-1">{error || 'This bot is not declared in bots.json.'}</p>
              <Link
                href="/bots"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
              >
                Return to Bots List
              </Link>
            </div>
          ) : (
            <>
              {/* Bot Header Card */}
              <div
                id="bot-detail-header-card"
                className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-6 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#1E293B]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 text-purple-400 shadow-md">
                      <Bot className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-white tracking-tight">
                          {bot.name}
                        </h2>
                        <StatusBadge status={bot.status} size="lg" />
                        {bot.autoStart && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Auto-Start on Boot
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        {bot.description || 'Configured Discord bot running on Ubuntu Home Server.'}
                      </p>

                      <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Folder className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{bot.path}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Code className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{bot.command} {bot.args.join(' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <BotControls
                      botId={bot.id}
                      botName={bot.name}
                      status={bot.status}
                      compact={false}
                      onActionSuccess={handleRefresh}
                    />
                  </div>
                </div>

                {/* Crash Information Banner if applicable */}
                {bot.status === 'crashed' && (
                  <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3 text-xs text-rose-300">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-200 text-sm">Process Crash Alert</h4>
                      <p className="font-mono mt-1 text-rose-300">{bot.lastCrashReason}</p>
                      <div className="mt-2 flex items-center gap-4 text-[11px] text-rose-400">
                        <span>Total Restarts Triggered: <strong>{bot.restartCount}</strong></span>
                        <span>Restart Limit: <strong>5 per 60 seconds</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4 Detail Metric Cards */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Status & PID */}
                  <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                      <Hash className="w-4 h-4 text-purple-400" />
                      <span>Process PID</span>
                    </div>
                    <p className="mt-1 text-base font-bold font-mono text-white">
                      {bot.status === 'online' && bot.pid ? bot.pid : '—'}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {bot.status === 'online' ? 'Active child process' : 'Process stopped'}
                    </span>
                  </div>

                  {/* CPU Usage */}
                  <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span>CPU Utilization</span>
                    </div>
                    <p className="mt-1 text-base font-bold font-mono text-white">
                      {bot.status === 'online' ? `${bot.cpuUsage}%` : '0%'}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Measured from host
                    </span>
                  </div>

                  {/* RAM Usage */}
                  <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>Memory (RAM)</span>
                    </div>
                    <p className="mt-1 text-base font-bold font-mono text-white">
                      {bot.status === 'online' ? `${bot.ramUsageMB} MB` : '0 MB'}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Resident Set Size (RSS)
                    </span>
                  </div>

                  {/* Uptime */}
                  <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Uptime</span>
                    </div>
                    <p className="mt-1 text-base font-bold font-mono text-white">
                      {bot.status === 'online' ? formatUptime(bot.uptime) : '—'}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Started: {bot.startedAt ? new Date(bot.startedAt).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bot Specific Terminal Console */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white text-base">
                      {bot.name} Live Logs
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Buffered in RAM: {bot.logsCount} lines
                  </span>
                </div>

                <Terminal
                  initialBotId={bot.id}
                  bots={allBots}
                  heightClass="h-[480px]"
                  showBotSelector={false}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
