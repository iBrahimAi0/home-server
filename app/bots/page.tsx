'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Play, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import { BotData, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BotCard } from '@/components/BotCard';

export default function BotsPage() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [botList, sys] = await Promise.all([
          api.getBots().catch(() => []),
          api.getSystemStatus().catch(() => null),
        ]);
        if (!isMounted) return;
        setBots(botList);
        if (sys) setSystemStatus(sys);
      } catch (err) {
        console.error('Error fetching bots:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

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

    const unsubSys = realtime.on<SystemStatusType>('system_metrics_update', (status) => {
      if (isMounted) setSystemStatus(status);
    });

    return () => {
      isMounted = false;
      unsubBots();
      unsubStatusChange();
      unsubSys();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [botList, sys] = await Promise.all([
        api.getBots().catch(() => []),
        api.getSystemStatus().catch(() => null),
      ]);
      setBots(botList);
      if (sys) setSystemStatus(sys);
    } finally {
      setRefreshing(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Mass action handlers
  const handleStartAll = async () => {
    const offlineBots = bots.filter((b) => b.status === 'offline' || b.status === 'crashed');
    if (offlineBots.length === 0) return;
    try {
      await Promise.all(offlineBots.map((b) => api.startBot(b.id)));
      showNotification('success', `Starting ${offlineBots.length} bot(s)...`);
      handleRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start all bots';
      showNotification('error', msg);
    }
  };

  const handleStopAll = async () => {
    const runningBots = bots.filter((b) => b.status === 'online' || b.status === 'starting');
    if (runningBots.length === 0) return;
    try {
      await Promise.all(runningBots.map((b) => api.stopBot(b.id)));
      showNotification('success', `Stopping ${runningBots.length} bot(s)...`);
      handleRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to stop all bots';
      showNotification('error', msg);
    }
  };

  const filteredBots = bots.filter((bot) => {
    if (statusFilter !== 'all' && bot.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        bot.name.toLowerCase().includes(q) ||
        bot.id.toLowerCase().includes(q) ||
        bot.path.toLowerCase().includes(q) ||
        (bot.description && bot.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const onlineCount = bots.filter((b) => b.status === 'online').length;
  const offlineCount = bots.filter((b) => b.status === 'offline').length;
  const crashedCount = bots.filter((b) => b.status === 'crashed').length;

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Discord Bot Manager"
          subtitle="Direct process management, lifecycle controls, and status monitoring"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`rounded-xl p-4 flex items-center justify-between text-xs font-semibold border ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Configured</span>
                <p className="text-2xl font-bold font-mono text-white mt-1">{bots.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Online & Active</span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{onlineCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Offline</span>
                <p className="text-2xl font-bold font-mono text-slate-400 mt-1">{offlineCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400">
                <Square className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Crashed</span>
                <p className={`text-2xl font-bold font-mono mt-1 ${crashedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {crashedCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search, Filter & Bulk Action Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111726]/90 border border-[#1E293B] p-4 rounded-xl">
            <div className="flex items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="input-bots-search"
                  placeholder="Search bots by name, ID, or path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0E17] text-white placeholder-slate-500 pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-700/70 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1 bg-[#0A0E17] p-1 rounded-lg border border-slate-700/70 text-xs">
                {(['all', 'online', 'offline', 'crashed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded capitalize font-medium transition-colors text-xs ${
                      statusFilter === st
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Mass controls */}
            <div className="flex items-center gap-2">
              <button
                id="btn-start-all"
                onClick={handleStartAll}
                disabled={onlineCount === bots.length}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start All</span>
              </button>

              <button
                id="btn-stop-all"
                onClick={handleStopAll}
                disabled={onlineCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop All</span>
              </button>

              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bot</span>
              </Link>
            </div>
          </div>

          {/* Bots Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-xl bg-[#111726]/60 border border-[#1E293B] animate-pulse" />
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-12 text-center">
              <Bot className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-white">No Discord Bots Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No bots match your current search or status filter.'
                  : 'Configure bots in backend/config/bots.json.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBots.map((bot) => (
                <BotCard key={bot.id} bot={bot} onRefresh={handleRefresh} />
              ))}
            </div>
          )}

          {/* Discord Bot Path & Cloned Folder Guide */}
          <div className="rounded-xl bg-[#111726]/70 border border-[#1E293B] p-5 flex items-start gap-3.5 text-xs text-slate-400">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-semibold mb-1">
                Ubuntu Directory Configuration
              </p>
              <p>
                Discord bot projects should be cloned into <code className="text-purple-300 font-mono">/home/ibra/home-server/bots/&lt;bot-id&gt;</code>. 
                Each folder should have its own <code className="text-slate-300 font-mono">package.json</code> with a <code className="text-slate-300 font-mono">start</code> script. 
                The dashboard will spawn them using <code className="text-slate-300 font-mono">child_process.spawn()</code> and keep them persistent.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
