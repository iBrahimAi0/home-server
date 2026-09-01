'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  HardDrive, 
  Database, 
  Clock, 
  Bot, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  Server,
  Plus
} from 'lucide-react';
import { BotData, SystemStatus as SystemStatusType, LogEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { BotCard } from '@/components/BotCard';
import { SystemStatus } from '@/components/SystemStatus';

function formatDaysUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0h';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function OverviewPage() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [sys, botList] = await Promise.all([
          api.getSystemStatus().catch(() => null),
          api.getBots().catch(() => []),
        ]);

        if (!isMounted) return;
        if (sys) setSystemStatus(sys);
        if (botList) setBots(botList);

        if (botList && botList.length > 0) {
          const logPromises = botList.slice(0, 3).map((b) => api.getBotLogs(b.id, 5));
          const allLogs = await Promise.all(logPromises);
          if (!isMounted) return;
          const merged = allLogs.flat().sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ).slice(0, 6);
          setRecentLogs(merged);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

    const unsubSys = realtime.on<SystemStatusType>('system_metrics_update', (status) => {
      if (isMounted) setSystemStatus(status);
    });

    const unsubBots = realtime.on<BotData[]>('bots_metrics_update', (updatedBots) => {
      if (isMounted) setBots(updatedBots);
    });

    const unsubStatusChange = realtime.on<BotData>('bot_status_changed', (updatedBot) => {
      if (isMounted) {
        setBots((prev) =>
          prev.map((b) => (b.id === updatedBot.id ? updatedBot : b))
        );
      }
    });

    const unsubNewLog = realtime.on<LogEntry>('new_log', (log) => {
      if (isMounted) {
        setRecentLogs((prev) => [log, ...prev.slice(0, 7)]);
      }
    });

    return () => {
      isMounted = false;
      unsubSys();
      unsubBots();
      unsubStatusChange();
      unsubNewLog();
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const [sys, botList] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getBots().catch(() => []),
      ]);
      if (sys) setSystemStatus(sys);
      if (botList) setBots(botList);
    } finally {
      setRefreshing(false);
    }
  };

  const onlineBots = bots.filter((b) => b.status === 'online');

  return (
    <div className="flex min-h-screen bg-[#0B0D13]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Server Overview"
          subtitle="Real-time telemetry and Discord bot process controller"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleManualRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-5">
          {/* Top Status Alert Banner */}
          <div
            id="banner-system-status"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-lg bg-[#121722] border border-[#1E273A] p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#182133] border border-[#232E44] text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Host Node Operational
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Host: <span className="text-slate-200">{systemStatus?.hostname || 'ubuntu-home-server'}</span> &bull; 
                  Target: <span className="text-indigo-400 font-medium">Ubuntu Server Node</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href="/bots"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <span>View Bots ({bots.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 Key System Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* CPU */}
            <StatCard
              id="stat-card-cpu"
              title="CPU Load"
              value={`${systemStatus?.cpu.usagePercentage ?? 0}%`}
              subtitle={`${systemStatus?.cpu.cores ?? 4} Cores @ ${systemStatus?.cpu.speedMHz ?? 2500}MHz`}
              percentage={systemStatus?.cpu.usagePercentage ?? 0}
              icon={Cpu}
              color="purple"
              badgeText="Active"
            />

            {/* RAM */}
            <StatCard
              id="stat-card-ram"
              title="Memory (RAM)"
              value={`${systemStatus?.ram.usedGB ?? 0}GB / ${systemStatus?.ram.totalGB ?? 0}GB`}
              subtitle={`Free: ${systemStatus?.ram.freeGB ?? 0}GB`}
              percentage={systemStatus?.ram.usagePercentage ?? 0}
              icon={HardDrive}
              color="blue"
              badgeText="DDR"
            />

            {/* Storage */}
            <StatCard
              id="stat-card-storage"
              title="SSD Storage"
              value={`${systemStatus?.storage.usedGB ?? 0}GB / ${systemStatus?.storage.totalGB ?? 0}GB`}
              subtitle={`Free: ${systemStatus?.storage.freeGB ?? 0}GB on root (/)`}
              percentage={systemStatus?.storage.usedPercentage ?? 0}
              icon={Database}
              color="emerald"
              badgeText="SSD"
            />

            {/* Uptime */}
            <StatCard
              id="stat-card-uptime"
              title="Node Uptime"
              value={formatDaysUptime(systemStatus?.uptime ?? 0)}
              subtitle="Daemon: systemd service"
              icon={Clock}
              color="amber"
              badgeText="Active"
            />
          </div>

          {/* Managed Bots Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Managed Discord Bots
                </h2>
                <span className="px-2 py-0.2 text-[11px] font-mono font-semibold rounded bg-[#182030] text-slate-300 border border-[#232E44]">
                  {onlineBots.length}/{bots.length} Online
                </span>
              </div>

              <Link
                href="/settings"
                className="text-xs font-mono font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Configure Bots</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-lg bg-[#121722] border border-[#1E273A] animate-pulse" />
                ))}
              </div>
            ) : bots.length === 0 ? (
              <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-8 text-center">
                <Bot className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold text-white">No Bots Configured</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-mono">
                  Add bot entries to <code className="text-indigo-300">backend/config/bots.json</code>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {bots.map((bot) => (
                  <BotCard key={bot.id} bot={bot} onRefresh={handleManualRefresh} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Two Columns: System Hardware Specs & Live Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* System Status Specifications */}
            <div className="lg:col-span-2">
              <SystemStatus status={systemStatus} />
            </div>

            {/* Live Activity Feed */}
            <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1E273A]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-xs">Recent Console Activity</h3>
                  </div>
                  <Link
                    href="/console"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>Full View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="mt-3 space-y-1.5 font-mono text-xs overflow-hidden">
                  {recentLogs.length === 0 ? (
                    <div className="text-slate-500 text-xs py-8 text-center font-mono">
                      Waiting for live process events...
                    </div>
                  ) : (
                    recentLogs.slice(0, 5).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-start gap-2 p-1.5 rounded bg-[#0C1018] border border-[#1A2232]"
                      >
                        <span className="text-slate-500 text-[10px] shrink-0">
                          {l.time}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded ${
                            l.type === 'ERROR'
                              ? 'text-rose-400 bg-rose-500/10'
                              : l.type === 'WARN'
                              ? 'text-amber-400 bg-amber-500/10'
                              : l.type === 'SYSTEM'
                              ? 'text-indigo-400 bg-indigo-500/10'
                              : 'text-sky-400 bg-sky-500/10'
                          }`}
                        >
                          {l.type}
                        </span>
                        <span className="text-slate-300 text-xs truncate flex-1" title={l.message}>
                          {l.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1E273A] text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span>Crash Protection: Active</span>
                <span className="text-emerald-400">systemd persistent</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
