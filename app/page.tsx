'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ShieldAlert, 
  Server,
  PlusCircle
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
  if (!seconds || seconds <= 0) return '0 hours';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours} hours`;
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

    // Connect realtime updates
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
  const crashedBots = bots.filter((b) => b.status === 'crashed');

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      {/* Collapsible Sidebar */}
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Server Overview"
          subtitle="Real-time monitoring and Discord bot management for your Ubuntu home server"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleManualRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Status Alert Banner */}
          <div
            id="banner-system-status"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#111726] via-[#141C2E] to-[#121A2C] border border-[#1E293B] p-4 sm:p-5 shadow-lg shadow-black/20"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-base font-bold text-white tracking-tight">
                    All Systems Operational
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Host: <span className="font-mono text-slate-300">{systemStatus?.hostname || 'ubuntu-home-server'}</span> &bull; 
                  Target: <span className="text-purple-400 font-medium">Ubuntu Server (i5 3rd Gen, 8GB RAM, 120GB Storage)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <Link
                href="/bots"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
              >
                <span>View All Bots ({bots.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 Key System Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU */}
            <StatCard
              id="stat-card-cpu"
              title="CPU Usage"
              value={`${systemStatus?.cpu.usagePercentage ?? 15}%`}
              subtitle={`${systemStatus?.cpu.cores ?? 4} Cores @ ${systemStatus?.cpu.speedMHz ?? 2600}MHz`}
              percentage={systemStatus?.cpu.usagePercentage ?? 15}
              icon={Cpu}
              color="purple"
              badgeText="Active"
            />

            {/* RAM */}
            <StatCard
              id="stat-card-ram"
              title="RAM Usage"
              value={`${systemStatus?.ram.usedGB ?? 4.2}GB / ${systemStatus?.ram.totalGB ?? 8}GB`}
              subtitle={`Free: ${systemStatus?.ram.freeGB ?? 3.8}GB available`}
              percentage={systemStatus?.ram.usagePercentage ?? 52}
              icon={HardDrive}
              color="blue"
              badgeText="DDR3"
            />

            {/* Storage */}
            <StatCard
              id="stat-card-storage"
              title="Storage Usage"
              value={`${systemStatus?.storage.usedGB ?? 40}GB / ${systemStatus?.storage.totalGB ?? 120}GB`}
              subtitle={`Free: ${systemStatus?.storage.freeGB ?? 80}GB on root (/)`}
              percentage={systemStatus?.storage.usedPercentage ?? 33}
              icon={Database}
              color="emerald"
              badgeText="SSD"
            />

            {/* Uptime */}
            <StatCard
              id="stat-card-uptime"
              title="Server Uptime"
              value={formatDaysUptime(systemStatus?.uptime ?? 259200)}
              subtitle="Daemon: systemd service"
              icon={Clock}
              color="amber"
              badgeText="Persistent"
            />
          </div>

          {/* Managed Bots Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Managed Discord Bots
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {onlineBots.length}/{bots.length} Online
                </span>
              </div>

              <Link
                href="/settings"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Bot / Configure</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-xl bg-[#111726]/60 border border-[#1E293B] animate-pulse" />
                ))}
              </div>
            ) : bots.length === 0 ? (
              <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-8 text-center">
                <Bot className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-white">No Discord Bots Configured</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Add bot configurations to <code className="text-purple-300 bg-slate-800 px-1.5 py-0.5 rounded">backend/config/bots.json</code>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bots.map((bot) => (
                  <BotCard key={bot.id} bot={bot} onRefresh={handleManualRefresh} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Two Columns: System Hardware Specs & Live Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Status Specifications */}
            <div className="lg:col-span-2">
              <SystemStatus status={systemStatus} />
            </div>

            {/* Live Activity Feed / Quick Console */}
            <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-white text-sm">Recent Activity</h3>
                  </div>
                  <Link
                    href="/console"
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <span>Full Console</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="mt-3.5 space-y-2 font-mono text-xs overflow-hidden">
                  {recentLogs.length === 0 ? (
                    <div className="text-slate-500 text-xs py-8 text-center">
                      Listening for real-time bot events...
                    </div>
                  ) : (
                    recentLogs.slice(0, 5).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-start gap-2 p-2 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60"
                      >
                        <span className="text-slate-500 text-[11px] shrink-0">
                          {l.time}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1 rounded ${
                            l.type === 'ERROR'
                              ? 'text-rose-400 bg-rose-500/10'
                              : l.type === 'WARN'
                              ? 'text-amber-400 bg-amber-500/10'
                              : l.type === 'SYSTEM'
                              ? 'text-purple-400 bg-purple-500/10'
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

              <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] text-slate-500 flex items-center justify-between font-mono">
                <span>Auto-restart protection: Active</span>
                <span className="text-emerald-400">Daemon: systemd service</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
