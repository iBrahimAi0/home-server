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
        console.error("Error fetching bots:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

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

  const handleStartAll = async () => {
    const offlineBots = bots.filter((b) => b.status === "offline");
    if (offlineBots.length === 0) return;
    try {
      toast.info(`Starting ${offlineBots.length} bot(s)...`);
      await Promise.all(offlineBots.map((b) => api.startBot(b.id)));
      toast.success(`Started ${offlineBots.length} bot(s).`);
      handleRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to start all bots";
      toast.error(msg);
    }
  };

  const handleStopAll = async () => {
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

  return (
    <div className="flex min-h-screen bg-[#080B10]">
      <Sidebar
        serverStatus={systemStatus?.status || "online"}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Discord Bot Fleet"
          subtitle="Direct process management, file inspection, and lifecycle controller"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-4.5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Configured
                </span>
                <p className="text-2xl font-extrabold font-mono text-white mt-1">
                  {bots.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-b from-[#182133] to-[#0F1422] border border-white/[0.08] text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                <Bot className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-4.5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Online
                </span>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                  {onlineCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-4.5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Offline
                </span>
                <p className="text-2xl font-extrabold font-mono text-slate-400 mt-1">
                  {offlineCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400">
                <Square className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-4.5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Crashed
                </span>
                <p
                  className={`text-2xl font-extrabold font-mono mt-1 ${crashedCount > 0 ? "text-rose-400" : "text-slate-400"}`}
                >
                  {crashedCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search, Filter & Action Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-[#0E131F]/90 border border-white/[0.07] p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="input-bots-search"
                  placeholder="Search bots by name, ID, or path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#090C12] text-white placeholder-slate-500 pl-9 pr-3.5 py-2 text-xs font-mono rounded-xl border border-white/[0.08] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#090C12] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
                {(["all", "online", "offline", "crashed"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors text-xs cursor-pointer ${
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
              <div className="flex items-center gap-2 bg-[#090C12] px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-mono">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
                >
                  <option value="status" className="bg-[#0E131F] text-white">
                    Sort: Status
                  </option>
                  <option value="name" className="bg-[#0E131F] text-white">
                    Sort: Name
                  </option>
                  <option value="cpu" className="bg-[#0E131F] text-white">
                    Sort: CPU
                  </option>
                  <option value="ram" className="bg-[#0E131F] text-white">
                    Sort: RAM
                  </option>
                </select>
              </div>
            </div>

            {/* Mass Controls & Add Bot Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-start-all"
                onClick={handleStartAll}
                disabled={onlineCount === bots.length}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start All</span>
              </button>

              <button
                id="btn-stop-all"
                onClick={handleStopAll}
                disabled={onlineCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop All</span>
              </button>

              <button
                id="btn-add-bot"
                onClick={() => setIsCreateBotOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Deploy Bot</span>
              </button>
            </div>
          </div>

          {/* Bots Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] animate-pulse"
                />
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-12 text-center font-mono">
              <div className="p-3.5 rounded-full bg-indigo-500/10 text-indigo-400 w-14 h-14 mx-auto flex items-center justify-center mb-3.5 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]">
                <Bot className="w-7 h-7" />
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
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deploy Your First Bot</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBots.map((bot) => (
                <BotCard key={bot.id} bot={bot} onRefresh={handleRefresh} />
              ))}
            </div>
          )}

          {/* Guide Banner */}
          <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-4.5 flex items-start gap-3.5 text-xs text-slate-400 font-mono shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-semibold mb-0.5">
                Isolated Process Security & Quotas
              </p>
              <p>
                Each bot runs inside its own isolated process group with automatic crash recovery, in-memory log buffer, RAM and disk storage quota limits, and zero-setup SQLite database management.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Create Bot Modal (3-Step Wizard) */}
      <CreateBotModal
        isOpen={isCreateBotOpen}
        onClose={() => setIsCreateBotOpen(false)}
        onCreated={() => {
          handleRefresh();
        }}
      />
    </div>
  );
}
