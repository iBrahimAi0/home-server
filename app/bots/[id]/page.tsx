'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  RotateCw
} from 'lucide-react';
import { BotData, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { BotControls } from '@/components/BotControls';
import { Terminal } from '@/components/Terminal';
import { FileManager } from '@/components/files/FileManager';
import { GitHubSync } from '@/components/git/GitHubSync';

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

type TabType = 'overview' | 'files' | 'logs' | 'github';

export default function BotDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const botId = resolvedParams.id;
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
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
          setError(`Bot with ID "${botId}" was not found in configuration.`);
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
    <div className="flex min-h-screen bg-[#0B0D13]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title={bot ? bot.name : 'Bot Details'}
          subtitle={`Process inspector, File Manager, Logs, and GitHub sync for ${botId}`}
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
              <div className="h-28 rounded-lg bg-[#121722] border border-[#1E273A] animate-pulse" />
              <div className="h-64 rounded-lg bg-[#121722] border border-[#1E273A] animate-pulse" />
            </div>
          ) : error || !bot ? (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-8 text-center">
              <AlertTriangle className="w-9 h-9 text-rose-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">Bot Not Found</h3>
              <p className="text-xs text-rose-300 mt-1 font-mono">{error || 'This bot is not declared in bots.json.'}</p>
              <Link
                href="/bots"
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                Return to Bots List
              </Link>
            </div>
          ) : (
            <>
              {/* Bot Header Card with Controls */}
              <div
                id="bot-detail-header-card"
                className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400 shadow-sm">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          {bot.name}
                        </h2>
                        <StatusBadge status={bot.status} size="md" />
                        {bot.autoStart && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Auto-Start
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
                        {bot.description || 'Configured Discord bot running on Ubuntu Home Server.'}
                      </p>

                      <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{bot.path}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-indigo-300">{bot.command} {bot.args.join(' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
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
                  <div className="mt-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-300 font-mono">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-200 text-xs">Process Crash Detected</h4>
                      <p className="mt-1 text-rose-300 text-[11px] break-all">{bot.lastCrashReason}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-rose-400">
                        <span>Restarts Triggered: <strong>{bot.restartCount}</strong></span>
                        <span>Auto-Restart Protection: <strong>5 per 60s</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs (Overview, Files, Logs, GitHub) */}
              <div className="flex items-center gap-1 border-b border-[#1E273A] pb-2 overflow-x-auto">
                <button
                  id="tab-btn-overview"
                  onClick={() => setActiveTab('overview')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer font-mono ${
                    activeTab === 'overview'
                      ? 'bg-[#182030] text-white border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131926]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Overview</span>
                </button>

                <button
                  id="tab-btn-files"
                  onClick={() => setActiveTab('files')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer font-mono ${
                    activeTab === 'files'
                      ? 'bg-[#182030] text-white border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131926]'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Files</span>
                </button>

                <button
                  id="tab-btn-logs"
                  onClick={() => setActiveTab('logs')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer font-mono ${
                    activeTab === 'logs'
                      ? 'bg-[#182030] text-white border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131926]'
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logs</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                    {bot.logsCount}
                  </span>
                </button>

                <button
                  id="tab-btn-github"
                  onClick={() => setActiveTab('github')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer font-mono ${
                    activeTab === 'github'
                      ? 'bg-[#182030] text-white border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131926]'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                  <span>GitHub Sync</span>
                </button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* 4 Detail Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Process PID */}
                    <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        <Hash className="w-3.5 h-3.5 text-indigo-400" />
                        <span>PID</span>
                      </div>
                      <p className="mt-1 text-lg font-bold font-mono text-white">
                        {bot.status === 'online' && bot.pid ? bot.pid : '—'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {bot.status === 'online' ? `PGID: -${bot.pid}` : 'Process offline'}
                      </span>
                    </div>

                    {/* CPU Usage */}
                    <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        <Cpu className="w-3.5 h-3.5 text-sky-400" />
                        <span>CPU</span>
                      </div>
                      <p className="mt-1 text-lg font-bold font-mono text-white">
                        {bot.status === 'online' ? `${bot.cpuUsage}%` : '0%'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ps telemetry
                      </span>
                    </div>

                    {/* RAM Usage */}
                    <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Memory (RAM)</span>
                      </div>
                      <p className="mt-1 text-lg font-bold font-mono text-white">
                        {bot.status === 'online' ? `${bot.ramUsageMB} MB` : '0 MB'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Resident Set Size
                      </span>
                    </div>

                    {/* Uptime */}
                    <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-3.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Uptime</span>
                      </div>
                      <p className="mt-1 text-lg font-bold font-mono text-white">
                        {bot.status === 'online' ? formatUptime(bot.uptime) : '—'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {bot.startedAt ? `Started: ${new Date(bot.startedAt).toLocaleTimeString()}` : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Environment & Working Directory Card */}
                  <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-4 space-y-2.5">
                    <h3 className="font-semibold text-white text-xs flex items-center gap-2 font-mono">
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Host Directory & Process Execution</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
                      <div className="p-2.5 rounded-md bg-[#0C1018] border border-[#1A2232]">
                        <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Working Directory:</span>
                        <span className="text-slate-200 font-semibold truncate block">{bot.path}</span>
                      </div>

                      <div className="p-2.5 rounded-md bg-[#0C1018] border border-[#1A2232]">
                        <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Spawn Command:</span>
                        <span className="text-indigo-300 font-semibold">{bot.command} {bot.args.join(' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: File Manager */}
              {activeTab === 'files' && (
                <FileManager
                  botId={bot.id}
                  botName={bot.name}
                  botPath={bot.path}
                />
              )}

              {/* Tab 3: Live Logs Console */}
              {activeTab === 'logs' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <TerminalIcon className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-white text-xs">
                        {bot.name} Stream Output
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      In-Memory Log Buffer: {bot.logsCount} lines
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

              {/* Tab 4: GitHub Synchronization */}
              {activeTab === 'github' && (
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
    </div>
  );
}
