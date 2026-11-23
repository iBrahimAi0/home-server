"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Plus,
  Search,
  Filter,
} from "lucide-react";
import {
  BotData,
  SystemStatus as SystemStatusType,
  LogEntry,
} from "@/lib/types";
import { api } from "@/lib/api";
import { realtime } from "@/lib/socket";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { BotCard } from "@/components/BotCard";
import { SystemStatus } from "@/components/SystemStatus";
import { CreateBotModal } from "@/components/bots/CreateBotModal";

function formatDaysUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0h";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function OverviewPage() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(
    null,
  );
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");

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
          const logPromises = botList
            .slice(0, 3)
            .map((b) => api.getBotLogs(b.id, 5));
          const allLogs = await Promise.all(logPromises);
          if (!isMounted) return;
          const merged = allLogs
            .flat()
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .slice(0, 6);
          setRecentLogs(merged);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

    const unsubSys = realtime.on<SystemStatusType>(
      "system_metrics_update",
      (status) => {
        if (isMounted) setSystemStatus(status);
      },
    );

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

    const unsubNewLog = realtime.on<LogEntry>("new_log", (log) => {
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

  const onlineBots = bots.filter((b) => b.status === "online");

  const filteredBots = bots.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.id.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "online") return b.status === "online";
    if (statusFilter === "offline") return b.status !== "online";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#080B10]">
      <Sidebar
        serverStatus={systemStatus?.status || "online"}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Command Dashboard"
          subtitle="Real-time telemetry and process controller for Discord bots"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleManualRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Status Hero Command Bar */}
          <div
            id="banner-system-status"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F1424]/90 via-[#0E131F]/90 to-[#12192B]/90 border border-white/[0.08] p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.5)]"
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#182236] to-[#0E1422] border border-white/[0.1] text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <h2 className="text-base font-extrabold text-white tracking-tight">
                      Host Node Operational
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Host:{" "}
                    <span className="text-slate-200 font-semibold">
                      {systemStatus?.hostname || "ubuntu-server"}
                    </span>{" "}
                    &bull; IP:{" "}
                    <span className="text-indigo-300 font-semibold">
                      {systemStatus?.serverIp || "192.168.11.105"}
                    </span>{" "}
                    &bull; Arch:{" "}
                    <span className="text-slate-300 font-medium">
                      {systemStatus?.arch || "x64"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
                <button
                  id="btn-hero-create-bot"
                  onClick={() => setIsCreateBotOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)] transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deploy Bot</span>
                </button>

                <Link
                  href="/bots"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.08] transition-all"
                >
                  <span>Fleet ({bots.length})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Key System Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              subtitle={`Free: ${systemStatus?.storage.freeGB ?? 0}GB on (/)`}
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

          {/* Managed Bots Fleet Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Managed Bot Fleet
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                  {onlineBots.length}/{bots.length} Active
                </span>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search bots..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-[#0E131F] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors w-36 sm:w-48 font-mono"
                  />
                </div>

                <div className="inline-flex rounded-xl bg-[#0E131F] border border-white/[0.08] p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === "all"
                        ? "bg-indigo-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("online")}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === "online"
                        ? "bg-emerald-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Online
                  </button>
                  <button
                    onClick={() => setStatusFilter("offline")}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === "offline"
                        ? "bg-rose-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredBots.length === 0 ? (
              <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-10 text-center">
                <Bot className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-bold text-white">
                  No Matching Bots Found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-mono">
                  {bots.length === 0
                    ? "Get started by deploying your first Discord bot process."
                    : "No bots match your current search or filter query."}
                </p>
                {bots.length === 0 && (
                  <button
                    onClick={() => setIsCreateBotOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Bot</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBots.map((bot) => (
                  <BotCard
                    key={bot.id}
                    bot={bot}
                    onRefresh={handleManualRefresh}
                  />
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
            <div className="rounded-2xl bg-[#0E131F]/90 border border-white/[0.07] p-5 flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-xs tracking-tight">
                      Live Console Activity
                    </h3>
                  </div>
                  <Link
                    href="/console"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Full View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="mt-3.5 space-y-2 font-mono text-xs overflow-hidden">
                  {recentLogs.length === 0 ? (
                    <div className="text-slate-500 text-xs py-8 text-center font-mono">
                      Waiting for live process events...
                    </div>
                  ) : (
                    recentLogs.slice(0, 5).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-start gap-2 p-2 rounded-xl bg-[#090C12]/90 border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                      >
                        <span className="text-slate-500 text-[10px] shrink-0 font-mono mt-0.5">
                          {l.time}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                            l.type === "ERROR"
                              ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                              : l.type === "WARN"
                                ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                                : l.type === "SYSTEM"
                                  ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                                  : "text-sky-400 bg-sky-500/10 border border-sky-500/20"
                          }`}
                        >
                          {l.type}
                        </span>
                        <span
                          className="text-slate-300 text-xs truncate flex-1 font-mono"
                          title={l.message}
                        >
                          {l.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span>Crash Protection: Active</span>
                <span className="text-emerald-400 font-semibold">Daemon Online</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Bot Modal */}
      <CreateBotModal
        isOpen={isCreateBotOpen}
        onClose={() => setIsCreateBotOpen(false)}
        onCreated={handleManualRefresh}
      />
    </div>
  );
}
