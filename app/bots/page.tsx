<<<<<<< HEAD
"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Info,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { BotData, SystemStatus as SystemStatusType } from "@/lib/types";
import { api } from "@/lib/api";
import { realtime } from "@/lib/socket";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BotCard } from "@/components/BotCard";
import { CreateBotModal } from "@/components/bots/CreateBotModal";
import { useToast } from "@/components/ui/Toast";

type SortOption = "name" | "status" | "cpu" | "ram";

export default function BotsPage() {
  const toast = useToast();
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
=======
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Square,
  Info
} from 'lucide-react';
import { BotData, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BotCard } from '@/components/BotCard';
import { CreateBotModal } from '@/components/bots/CreateBotModal';

export default function BotsPage() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false);

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
<<<<<<< HEAD
        console.error("Error fetching bots:", err);
=======
        console.error('Error fetching bots:', err);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

<<<<<<< HEAD
    const unsubBots = realtime.on<BotData[]>(
      "bots_metrics_update",
      (updatedBots) => {
        if (isMounted) setBots(updatedBots);
      },
    );

    const unsubStatusChange = realtime.on<BotData>(
      "bot_status_changed",
      (updatedBot) => {
        if (isMounted) {
          setBots((prev) =>
            prev.map((b) => (b.id === updatedBot.id ? updatedBot : b)),
          );
        }
      },
    );

    const unsubSys = realtime.on<SystemStatusType>(
      "system_metrics_update",
      (status) => {
        if (isMounted) setSystemStatus(status);
      },
    );
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

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

<<<<<<< HEAD
  const handleStartAll = async () => {
    const offlineBots = bots.filter(
      (b) => b.status === "offline" || b.status === "crashed",
    );
    if (offlineBots.length === 0) return;
    try {
      toast.info(`Sending start signal to ${offlineBots.length} bot(s)...`);
      await Promise.all(offlineBots.map((b) => api.startBot(b.id)));
      toast.success(`Successfully launched ${offlineBots.length} bot(s)!`);
      handleRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to start all bots";
      toast.error(msg);
=======
  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    }
  };

  const handleStopAll = async () => {
<<<<<<< HEAD
    const runningBots = bots.filter(
      (b) => b.status === "online" || b.status === "starting",
    );
    if (runningBots.length === 0) return;
    try {
      toast.info(`Stopping ${runningBots.length} bot(s)...`);
      await Promise.all(runningBots.map((b) => api.stopBot(b.id)));
      toast.success(`Stopped ${runningBots.length} bot(s).`);
      handleRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to stop all bots";
      toast.error(msg);
    }
  };

  // Filter and sort bots
  const filteredBots = bots
    .filter((bot) => {
      if (statusFilter !== "all" && bot.status !== statusFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          bot.name.toLowerCase().includes(q) ||
          bot.id.toLowerCase().includes(q) ||
          bot.path.toLowerCase().includes(q) ||
          (bot.description && bot.description.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "status") {
        const statusOrder: Record<string, number> = {
          online: 0,
          starting: 1,
          crashed: 2,
          stopping: 3,
          offline: 4,
        };
        return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "cpu") {
        return (b.cpuUsage || 0) - (a.cpuUsage || 0);
      }
      if (sortBy === "ram") {
        return (b.ramUsageMB || 0) - (a.ramUsageMB || 0);
      }
      return 0;
    });

  const onlineCount = bots.filter((b) => b.status === "online").length;
  const offlineCount = bots.filter((b) => b.status === "offline").length;
  const crashedCount = bots.filter((b) => b.status === "crashed").length;
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

  return (
    <div className="flex min-h-screen bg-[#0B0D13]">
      <Sidebar
<<<<<<< HEAD
        serverStatus={systemStatus?.status || "online"}
=======
        serverStatus={systemStatus?.status || 'online'}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Discord Bot Inventory"
          subtitle="Direct process management, file inspection, and lifecycle controller"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-5">
<<<<<<< HEAD
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                  Total Configured
                </span>
                <p className="text-2xl font-bold font-mono text-white mt-0.5">
                  {bots.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#182133] border border-[#232E44] text-indigo-400 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                  Online
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                  {onlineCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#122620] border border-[#183B30] text-emerald-400 shadow-inner">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                  Offline
                </span>
                <p className="text-2xl font-bold font-mono text-slate-400 mt-0.5">
                  {offlineCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#182030] border border-[#232E44] text-slate-400 shadow-inner">
                <Square className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                  Crashed
                </span>
                <p
                  className={`text-2xl font-bold font-mono mt-0.5 ${crashedCount > 0 ? "text-rose-400" : "text-slate-400"}`}
                >
                  {crashedCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#261418] border border-[#3E1C24] text-rose-400 shadow-inner">
                <AlertTriangle className="w-5 h-5" />
=======
          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`rounded-md p-3.5 flex items-center justify-between text-xs font-mono font-semibold border ${
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
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Total Configured</span>
                <p className="text-xl font-bold font-mono text-white mt-0.5">{bots.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Online</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{onlineCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#122620] border border-[#183B30] text-emerald-400">
                <Play className="w-4 h-4 fill-current" />
              </div>
            </div>

            <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Offline</span>
                <p className="text-xl font-bold font-mono text-slate-400 mt-0.5">{offlineCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#182030] border border-[#232E44] text-slate-400">
                <Square className="w-4 h-4 fill-current" />
              </div>
            </div>

            <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Crashed</span>
                <p className={`text-xl font-bold font-mono mt-0.5 ${crashedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {crashedCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[#261418] border border-[#3E1C24] text-rose-400">
                <AlertTriangle className="w-4 h-4" />
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Search, Filter & Action Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#121722] border border-[#1E273A] p-3.5 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
=======
          {/* Search, Filter & Bulk Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121722] border border-[#1E273A] p-3.5 rounded-lg">
            <div className="flex items-center gap-2.5 flex-1">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="input-bots-search"
                  placeholder="Search bots by name, ID, or path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
                  className="w-full bg-[#0B0E14] text-white placeholder-slate-500 pl-8 pr-3 py-2 text-xs font-mono rounded-lg border border-[#1E273A] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-0.5 bg-[#0B0E14] p-1 rounded-lg border border-[#1E273A] text-xs font-mono">
                {(["all", "online", "offline", "crashed"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors text-[11px] cursor-pointer ${
                        statusFilter === st
                          ? "bg-indigo-600 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ),
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#0B0E14] px-2 py-1 rounded-lg border border-[#1E273A] text-xs font-mono">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-300 text-xs font-mono focus:outline-none cursor-pointer"
                >
                  <option value="status" className="bg-[#121722] text-white">
                    Status
                  </option>
                  <option value="name" className="bg-[#121722] text-white">
                    Name
                  </option>
                  <option value="cpu" className="bg-[#121722] text-white">
                    CPU
                  </option>
                  <option value="ram" className="bg-[#121722] text-white">
                    RAM
                  </option>
                </select>
              </div>
            </div>

            {/* Mass Controls & Add Bot Button */}
            <div className="flex items-center gap-2 flex-wrap">
=======
                  className="w-full bg-[#0B0E14] text-white placeholder-slate-500 pl-8 pr-3 py-1.5 text-xs font-mono rounded-md border border-[#1E273A] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-0.5 bg-[#0B0E14] p-0.5 rounded-md border border-[#1E273A] text-xs font-mono">
                {(['all', 'online', 'offline', 'crashed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded capitalize font-medium transition-colors text-[11px] cursor-pointer ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white font-semibold'
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              <button
                id="btn-start-all"
                onClick={handleStartAll}
                disabled={onlineCount === bots.length}
<<<<<<< HEAD
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
=======
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
                <span>Start All</span>
              </button>

              <button
                id="btn-stop-all"
                onClick={handleStopAll}
                disabled={onlineCount === 0}
<<<<<<< HEAD
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
=======
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
                <span>Stop All</span>
              </button>

              <button
                id="btn-add-bot"
                onClick={() => setIsCreateBotOpen(true)}
<<<<<<< HEAD
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Bot</span>
=======
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bot</span>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              </button>
            </div>
          </div>

          {/* Bots Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
<<<<<<< HEAD
                <div
                  key={i}
                  className="h-56 rounded-xl bg-[#121722] border border-[#1E273A] animate-pulse"
                />
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-12 text-center font-mono">
              <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 w-12 h-12 mx-auto flex items-center justify-center mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                No Bots Found
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No bots match your current filter parameters."
                  : "Get started by creating a new Discord bot with a starter template or by uploading your project ZIP."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={() => setIsCreateBotOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Your First Bot</span>
                </button>
              )}
=======
                <div key={i} className="h-52 rounded-lg bg-[#121722] border border-[#1E273A] animate-pulse" />
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-10 text-center font-mono">
              <Bot className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-white font-sans">No Bots Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No bots match your current filter parameters.'
                  : 'Click "Add Bot" above to create your first bot directly from the dashboard.'}
              </p>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBots.map((bot) => (
                <BotCard key={bot.id} bot={bot} onRefresh={handleRefresh} />
              ))}
            </div>
          )}

<<<<<<< HEAD
          {/* Guide Banner */}
          <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex items-start gap-3 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-semibold mb-0.5">
                Isolated Process Security & Storage
              </p>
              <p>
                Each bot runs inside its own isolated process group with
                automatic crash recovery, in-memory log buffer, and sandboxed
                file access. You can upload project archives (.zip) or manage
                environment variables at any time.
=======
          {/* Directory Configuration Guide */}
          <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-4 flex items-start gap-3 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-semibold mb-0.5">
                Bot Host Path Standard
              </p>
              <p>
                Place bot project folders in <code className="text-indigo-300">/home/ibra/home-server/bots/&lt;bot-id&gt;</code>. 
                Each folder is managed within its own process group with full file management and safe GitHub sync.
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              </p>
            </div>
          </div>
        </main>
      </div>

<<<<<<< HEAD
      {/* Create Bot Modal (3-Step Wizard) */}
=======
      {/* Create Bot Modal */}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      <CreateBotModal
        isOpen={isCreateBotOpen}
        onClose={() => setIsCreateBotOpen(false)}
        onCreated={() => {
<<<<<<< HEAD
=======
          showNotification('success', 'Bot created successfully.');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          handleRefresh();
        }}
      />
    </div>
  );
}
