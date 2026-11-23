"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Search,
  Plus,
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
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
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
      const msg = err instanceof Error ? err.message : "Failed to start all bots";
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
      const msg = err instanceof Error ? err.message : "Failed to stop all bots";
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
    <div className="flex min-h-screen bg-[#0D0E12] text-slate-100 font-sans">
      <Sidebar
        currentBotId={bots[0]?.id || "bot-1"}
        activeTab="overview"
        bots={bots}
        onRefresh={handleRefresh}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-200">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Header
            title="Server Fleet"
            badge={<span>{bots.length} Active Containers</span>}
          />

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="forge-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Configured
                </span>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {bots.length}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1C1E24] text-[#FACC15]">
                <Bot className="w-5 h-5" />
              </div>
            </div>

            <div className="forge-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Online
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {onlineCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="forge-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Offline
                </span>
                <p className="text-2xl font-bold font-mono text-slate-400 mt-1">
                  {offlineCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1C1E24] text-slate-400">
                <Square className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="forge-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                  Crashed
                </span>
                <p className={`text-2xl font-bold font-mono mt-1 ${crashedCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
                  {crashedCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Square className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search, Filter & Action Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 forge-card p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="input-bots-search"
                  placeholder="Search servers by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0D0E12] text-white placeholder-slate-500 pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-[#1C1E24] focus:outline-none focus:border-[#FACC15] transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#0D0E12] p-1 rounded-lg border border-[#1C1E24] text-xs font-mono">
                {(["all", "online", "offline", "crashed"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded capitalize font-medium transition-colors text-xs cursor-pointer ${
                        statusFilter === st
                          ? "bg-[#1C1E24] text-[#FACC15] font-semibold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ),
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 bg-[#0D0E12] px-3 py-1.5 rounded-lg border border-[#1C1E24] text-xs font-mono">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
                >
                  <option value="status" className="bg-[#14161B] text-white">Sort: Status</option>
                  <option value="name" className="bg-[#14161B] text-white">Sort: Name</option>
                  <option value="cpu" className="bg-[#14161B] text-white">Sort: CPU</option>
                  <option value="ram" className="bg-[#14161B] text-white">Sort: RAM</option>
                </select>
              </div>
            </div>

            {/* Mass Controls & Add Bot Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-start-all"
                onClick={handleStartAll}
                disabled={onlineCount === bots.length}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start All</span>
              </button>

              <button
                id="btn-stop-all"
                onClick={handleStopAll}
                disabled={onlineCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop All</span>
              </button>

              <button
                id="btn-add-bot"
                onClick={() => setIsCreateBotOpen(true)}
                className="forge-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy Server</span>
              </button>
            </div>
          </div>

          {/* Bots Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-xl bg-[#14161B] border border-[#1C1E24] animate-pulse"
                />
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="forge-card p-12 text-center font-mono">
              <div className="p-3.5 rounded-full bg-[#FACC15]/10 text-[#FACC15] w-12 h-12 mx-auto flex items-center justify-center mb-3.5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white font-sans">
                No Servers Found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No servers match your current filter parameters."
                  : "Get started by deploying a new server container or uploading a project ZIP."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={() => setIsCreateBotOpen(true)}
                  className="mt-4 forge-btn-primary"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deploy First Server</span>
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
          <div className="forge-card p-4 flex items-start gap-3 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-semibold mb-0.5">
                Isolated Process Security & Quotas
              </p>
              <p>
                Each server container runs inside its own isolated process group with automatic crash recovery, in-memory log stream, RAM and disk storage quota limits, and zero-setup SQLite database management.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Create Bot Modal */}
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
