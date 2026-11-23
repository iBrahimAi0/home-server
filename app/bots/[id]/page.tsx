"use client";

import React, { useState, useEffect, Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Code,
  FileCode2,
  Layers,
  GitBranch,
  Key,
  UploadCloud,
  Download,
  Wrench,
  Loader2,
  RefreshCw,
  Database,
  Sliders,
} from "lucide-react";
import { BotData, SystemStatus as SystemStatusType } from "@/lib/types";
import { api } from "@/lib/api";
import { realtime } from "@/lib/socket";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { BotControls } from "@/components/BotControls";
import { Terminal } from "@/components/Terminal";
import { FileManager } from "@/components/files/FileManager";
import { GitHubSync } from "@/components/git/GitHubSync";
import { EnvManagerTab } from "@/components/bots/EnvManagerTab";
import { DatabaseManagerTab } from "@/components/bots/DatabaseManagerTab";
import { UploadProjectModal } from "@/components/bots/UploadProjectModal";
import { useToast } from "@/components/ui/Toast";

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

type TabType = "overview" | "files" | "database" | "env" | "logs" | "github";

function BotDetailsContent({ botId }: { botId: string }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "overview";
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [bot, setBot] = useState<BotData | null>(null);
  const [allBots, setAllBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUploadProjectOpen, setIsUploadProjectOpen] = useState(false);
  const [isConfigLimitsOpen, setIsConfigLimitsOpen] = useState(false);
  const [editRamLimit, setEditRamLimit] = useState<number>(512);
  const [editStorageLimit, setEditStorageLimit] = useState<number>(1024);
  const [isSavingLimits, setIsSavingLimits] = useState(false);

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
          setError(`Bot with ID "${botId}" was not found in configuration.`);
        } else {
          setBot(botData);
          setError(null);
        }
        setAllBots(botsList || []);
        if (sys) setSystemStatus(sys);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load bot";
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

    const unsubStatus = realtime.on<BotData>(
      "bot_status_changed",
      (updatedBot) => {
        if (!isMounted || !updatedBot) return;
        if (updatedBot.id === botId) {
          setBot(updatedBot);
        }
        setAllBots((prev) =>
          prev.map((b) => (b.id === updatedBot.id ? updatedBot : b)),
        );
      },
    );

    const unsubMetrics = realtime.on<BotData[]>(
      "bots_metrics_update",
      (updatedBots) => {
        if (!isMounted || !updatedBots) return;
        setAllBots(updatedBots);
        const target = updatedBots.find((b) => b.id === botId);
        if (target) {
          setBot(target);
        }
      },
    );

    const unsubSys = realtime.on<SystemStatusType>(
      "system_metrics_update",
      (status) => {
        if (isMounted && status) setSystemStatus(status);
      },
    );

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
      setAllBots(botsList || []);
      if (sys) setSystemStatus(sys);
    } finally {
      setRefreshing(false);
    }
  };

  const handleInstallDependencies = async () => {
    setIsInstalling(true);
    toast.info(
      `Running package installer for ${bot?.name}... Check Logs tab for streaming output.`,
    );
    try {
      const res = await api.installBotDependencies(botId);
      toast.success(res.message || "Dependencies installed successfully.");
      handleRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Dependency installation failed.";
      toast.error(msg, "Install Error");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleExportProject = () => {
    const url = api.getBotProjectExportUrl(botId);
    window.open(url, "_blank");
    toast.info(`Exporting ${bot?.name} project archive (.zip)...`);
  };

  const handleOpenLimitsModal = () => {
    if (bot) {
      setEditRamLimit(bot.ramLimitMB || 0);
      setEditStorageLimit(bot.storageLimitMB || 0);
    }
    setIsConfigLimitsOpen(true);
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bot) return;
    setIsSavingLimits(true);
    try {
      await api.updateBot(botId, {
        ramLimitMB: editRamLimit,
        storageLimitMB: editStorageLimit,
      });
      toast.success(
        "Resource limits updated successfully.",
        "Limits Updated",
      );
      setIsConfigLimitsOpen(false);
      handleRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update limits";
      toast.error(msg, "Update Failed");
    } finally {
      setIsSavingLimits(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0D13]">
      <Sidebar
        serverStatus={systemStatus?.status || "online"}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title={bot ? bot.name : "Bot Details"}
          subtitle={`Process inspector, File Manager, Environment Secrets, and GitHub sync for ${botId}`}
          bots={allBots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-5">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Link
              href="/bots"
              className="inline-flex items-center gap-1 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bots</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold">{botId}</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-28 rounded-xl bg-[#121722] border border-[#1E273A] animate-pulse" />
              <div className="h-64 rounded-xl bg-[#121722] border border-[#1E273A] animate-pulse" />
            </div>
          ) : error || !bot ? (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-8 text-center">
              <AlertTriangle className="w-9 h-9 text-rose-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">Bot Not Found</h3>
              <p className="text-xs text-rose-300 mt-1 font-mono">
                {error || "This bot is not declared in bots.json."}
              </p>
              <Link
                href="/bots"
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                Return to Bots List
              </Link>
            </div>
          ) : (
            <>
              {/* Bot Header Card with Controls */}
              <div
                id="bot-detail-header-card"
                className="rounded-xl bg-[#121722] border border-[#1E273A] p-5 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#182133] border border-[#232E44] text-indigo-400 shadow-inner">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-white tracking-tight">
                          {bot.name}
                        </h2>
                        <StatusBadge status={bot.status} size="md" />
                        {bot.autoStart && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Auto-Start
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
                        {bot.description ||
                          "Configured Discord bot running on Ubuntu Home Server."}
                      </p>

                      <div className="mt-2.5 flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{bot.path}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-indigo-300">
                            {bot.command || "npm"} {(bot.args || []).join(" ")}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Controls */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <BotControls
                      botId={bot.id}
                      botName={bot.name}
                      status={bot.status}
                      compact={false}
                      onActionSuccess={(action, msg) => {
                        toast.success(
                          msg || `Bot ${action} successful`,
                          `Bot ${action}`,
                        );
                        handleRefresh();
                      }}
                      onActionError={(action, err) => {
                        toast.error(err, `${action} Failed`);
                      }}
                    />
                  </div>
                </div>

                {/* Crash Information Banner if applicable */}
                {bot.status === "crashed" && (
                  <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-300 font-mono">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-200 text-xs">
                        Process Crash Detected
                      </h4>
                      <p className="mt-1 text-rose-300 text-[11px] break-all">
                        {bot.lastCrashReason}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-rose-400">
                        <span>
                          Restarts Triggered:{" "}
                          <strong>{bot.restartCount || 0}</strong>
                        </span>
                        <span>
                          Auto-Restart Protection: <strong>5 per 60s</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs (Overview, Files, Secrets, Logs, GitHub) */}
              <div className="flex items-center gap-1.5 border-b border-[#1E273A] pb-2 overflow-x-auto">
                <button
                  id="tab-btn-overview"
                  onClick={() => setActiveTab("overview")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-[#182030] text-white border border-indigo-500/40 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Overview</span>
                </button>

                <button
                  id="tab-btn-files"
                  onClick={() => setActiveTab("files")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "files"
                      ? "bg-[#182030] text-white border border-indigo-500/40 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Files</span>
                </button>

                <button
                  id="tab-btn-database"
                  onClick={() => setActiveTab("database")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "database"
                      ? "bg-[#182030] text-white border border-indigo-500/40 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Database</span>
                </button>

                <button
                  id="tab-btn-env"
                  onClick={() => setActiveTab("env")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "env"
                      ? "bg-[#182030] text-white border border-indigo-500/40 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Environment & Secrets</span>
                </button>

                <button
                  id="tab-btn-logs"
                  onClick={() => setActiveTab("logs")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "logs"
                      ? "bg-[#182030] text-white border border-indigo-500/40 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logs</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {bot.logsCount || 0}
                  </span>
                </button>

                <button
                  id="tab-btn-github"
                  onClick={() => setActiveTab("github")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeTab === "github"
                      ? "bg-[#182030] text-white border border-indigo-500/40 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                  <span>GitHub Sync</span>
                </button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Quick Action Suite */}
                  <div className="p-3.5 rounded-xl bg-[#121722] border border-[#1E273A] flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">
                        Quick Actions:
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setIsUploadProjectOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Project (.ZIP)</span>
                      </button>

                      <button
                        onClick={handleInstallDependencies}
                        disabled={isInstalling}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isInstalling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>Install Dependencies</span>
                      </button>

                      <button
                        onClick={handleExportProject}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export Backup (.ZIP)</span>
                      </button>

                      <button
                        onClick={handleOpenLimitsModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Set RAM & Storage</span>
                      </button>
                    </div>
                  </div>

                  {/* 5 Detail Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Process PID */}
                    <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                          <Hash className="w-3.5 h-3.5 text-indigo-400" />
                          <span>PID</span>
                        </div>
                        <p className="mt-1 text-xl font-bold font-mono text-white">
                          {bot.status === "online" && bot.pid ? bot.pid : "—"}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {bot.status === "online"
                          ? `PGID: -${bot.pid}`
                          : "Process offline"}
                      </span>
                    </div>

                    {/* CPU Usage */}
                    <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                          <Cpu className="w-3.5 h-3.5 text-sky-400" />
                          <span>CPU Load</span>
                        </div>
                        <p className="mt-1 text-xl font-bold font-mono text-white">
                          {bot.status === "online"
                            ? `${bot.cpuUsage || 0}%`
                            : "0%"}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        ps telemetry
                      </span>
                    </div>

                    {/* RAM Usage & Limit */}
                    <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase font-mono">
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Memory (RAM)</span>
                          </span>
                          {bot.ramLimitMB > 0 && (
                            <span className="text-indigo-400 text-[9px]">
                              Max {bot.ramLimitMB}M
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xl font-bold font-mono text-white">
                          {bot.status === "online"
                            ? `${bot.ramUsageMB || 0} MB`
                            : "0 MB"}
                        </p>
                      </div>

                      {/* Visual progress bar */}
                      <div className="mt-1.5">
                        <div className="w-full bg-[#1A2232] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              bot.ramLimitMB > 0 &&
                              bot.ramUsageMB > bot.ramLimitMB * 0.85
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${
                                bot.ramLimitMB > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        ((bot.ramUsageMB || 0) /
                                          bot.ramLimitMB) *
                                          100,
                                      ),
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">
                          {bot.ramLimitMB > 0
                            ? `${Math.round(((bot.ramUsageMB || 0) / bot.ramLimitMB) * 100)}% of ${bot.ramLimitMB}MB`
                            : "Resident Set Size (Unlimited)"}
                        </span>
                      </div>
                    </div>

                    {/* Storage Footprint & Limit */}
                    <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase font-mono">
                          <span className="flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-amber-400" />
                            <span>Storage</span>
                          </span>
                          {bot.storageLimitMB > 0 && (
                            <span className="text-amber-400 text-[9px]">
                              Max {bot.storageLimitMB}M
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xl font-bold font-mono text-white">
                          {bot.storageUsedMB || 0} MB
                        </p>
                      </div>

                      {/* Storage progress bar */}
                      <div className="mt-1.5">
                        <div className="w-full bg-[#1A2232] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              bot.storageLimitMB > 0 &&
                              bot.storageUsedMB > bot.storageLimitMB * 0.85
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                            style={{
                              width: `${
                                bot.storageLimitMB > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        ((bot.storageUsedMB || 0) /
                                          bot.storageLimitMB) *
                                          100,
                                      ),
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">
                          {bot.storageLimitMB > 0
                            ? `${Math.round(((bot.storageUsedMB || 0) / bot.storageLimitMB) * 100)}% of ${bot.storageLimitMB}MB`
                            : "Disk Usage (Unlimited)"}
                        </span>
                      </div>
                    </div>

                    {/* Uptime */}
                    <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Uptime</span>
                        </div>
                        <p className="mt-1 text-xl font-bold font-mono text-white">
                          {bot.status === "online"
                            ? formatUptime(bot.uptime)
                            : "—"}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {bot.startedAt
                          ? `Started: ${new Date(bot.startedAt).toLocaleTimeString()}`
                          : "Offline"}
                      </span>
                    </div>
                  </div>

                  {/* Environment & Working Directory Card */}
                  <div className="rounded-xl bg-[#121722] border border-[#1E273A] p-4 space-y-3">
                    <h3 className="font-semibold text-white text-xs flex items-center gap-2 font-mono">
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Host Directory & Process Configuration</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-[#0C1018] border border-[#1A2232]">
                        <span className="text-slate-400 block mb-1 text-[10px] uppercase font-semibold">
                          Working Directory:
                        </span>
                        <span className="text-slate-200 font-semibold truncate block">
                          {bot.path || "—"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-[#0C1018] border border-[#1A2232]">
                        <span className="text-slate-400 block mb-1 text-[10px] uppercase font-semibold">
                          Spawn Command:
                        </span>
                        <span className="text-indigo-300 font-semibold">
                          {bot.command || "npm"} {(bot.args || []).join(" ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: File Manager */}
              {activeTab === "files" && (
                <FileManager
                  botId={bot.id}
                  botName={bot.name}
                  botPath={bot.path}
                />
              )}

              {/* Tab 3: Database Manager */}
              {activeTab === "database" && (
                <DatabaseManagerTab
                  botId={bot.id}
                  botName={bot.name}
                />
              )}

              {/* Tab 4: Environment & Secrets Manager */}
              {activeTab === "env" && (
                <EnvManagerTab
                  botId={bot.id}
                  botName={bot.name}
                  botStatus={bot.status}
                  onRestartRequest={handleRefresh}
                />
              )}

              {/* Tab 4: Live Logs Console */}
              {activeTab === "logs" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <TerminalIcon className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-white text-xs">
                        {bot.name} Stream Output
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      In-Memory Log Buffer: {bot.logsCount || 0} lines
                    </span>
                  </div>

                  <Terminal
                    initialBotId={bot.id}
                    bots={allBots}
                    heightClass="h-[520px]"
                    showBotSelector={false}
                  />
                </div>
              )}

              {/* Tab 5: GitHub Synchronization */}
              {activeTab === "github" && (
                <GitHubSync
                  botId={bot.id}
                  botName={bot.name}
                  botPath={bot.path}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Upload Project Modal */}
      {bot && (
        <UploadProjectModal
          botId={bot.id}
          botName={bot.name}
          isOpen={isUploadProjectOpen}
          onClose={() => setIsUploadProjectOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Configure Resource Limits Modal */}
      {bot && isConfigLimitsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#0E121A] border border-[#1E273A] rounded-xl shadow-2xl p-5 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-[#1E273A] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Configure Resource Limits for {bot.name}
                </h3>
              </div>
              <button
                onClick={() => setIsConfigLimitsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLimits} className="space-y-4">
              {/* RAM Limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-medium text-slate-300">
                    RAM Limit (MB)
                  </label>
                  <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                    {editRamLimit === 0 ? "Unlimited" : `${editRamLimit} MB`}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={64}
                  value={editRamLimit}
                  onChange={(e) =>
                    setEditRamLimit(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#080B10] border border-[#1E273A] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="mt-1.5 flex items-center gap-1.5">
                  {[256, 512, 1024, 2048].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setEditRamLimit(mb)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        editRamLimit === mb
                          ? "bg-indigo-600 text-white font-bold"
                          : "bg-[#182030] text-slate-400 hover:text-white"
                      }`}
                    >
                      {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditRamLimit(0)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      editRamLimit === 0
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-[#182030] text-slate-400 hover:text-white"
                    }`}
                  >
                    Unlimited
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Node processes automatically receive --max-old-space-size
                </p>
              </div>

              {/* Storage Limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-medium text-slate-300">
                    Storage Limit (MB)
                  </label>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold">
                    {editStorageLimit === 0 ? "Unlimited" : `${editStorageLimit} MB`}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={256}
                  value={editStorageLimit}
                  onChange={(e) =>
                    setEditStorageLimit(
                      Math.max(0, parseInt(e.target.value, 10) || 0),
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#080B10] border border-[#1E273A] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="mt-1.5 flex items-center gap-1.5">
                  {[500, 1000, 2000, 5000].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setEditStorageLimit(mb)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        editStorageLimit === mb
                          ? "bg-amber-600 text-white font-bold"
                          : "bg-[#182030] text-slate-400 hover:text-white"
                      }`}
                    >
                      {mb >= 1000 ? `${mb / 1000} GB` : `${mb} MB`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditStorageLimit(0)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      editStorageLimit === 0
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-[#182030] text-slate-400 hover:text-white"
                    }`}
                  >
                    Unlimited
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Enforced on file uploads, code edits, and archive extractions
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E273A]">
                <button
                  type="button"
                  onClick={() => setIsConfigLimitsOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#182030] border border-[#232E44] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLimits}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  {isSavingLimits ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sliders className="w-3.5 h-3.5" />
                  )}
                  <span>Save Limits</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BotDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#0B0D13] items-center justify-center text-slate-400 font-mono text-xs">
          Loading bot details...
        </div>
      }
    >
      <BotDetailsContent botId={resolvedParams.id} />
    </Suspense>
  );
}
