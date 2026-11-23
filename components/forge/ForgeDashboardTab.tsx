'use client';

import React, { useState, useEffect } from 'react';
import { 
  BotData, 
  SystemStatus, 
  LogEntry 
} from '@/lib/types';
import { ForgeHexagon } from '@/components/NexusLogo';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface ForgeDashboardTabProps {
  bot: BotData;
  systemStatus: SystemStatus | null;
  onRefresh?: () => void;
  onTabChange?: (tab: string) => void;
}

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

export function ForgeDashboardTab({ bot, systemStatus, onRefresh, onTabChange }: ForgeDashboardTabProps) {
  const toast = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api.getBotLogs(bot.id, 20).then((entries) => {
      if (isMounted) setLogs(entries);
    }).catch(() => {});

    const unsubLog = realtime.on<LogEntry>('new_log', (log) => {
      if (isMounted && log.botId === bot.id) {
        setLogs((prev) => [...prev.slice(-30), log]);
      }
    });

    return () => {
      isMounted = false;
      unsubLog();
    };
  }, [bot.id]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isSendingCommand) return;

    const cmd = commandInput.trim();
    setCommandInput('');
    setIsSendingCommand(true);

    try {
      if (bot.status === 'online') {
        await api.sendBotStdin(bot.id, cmd);
      } else {
        await api.executeBotCommand(bot.id, cmd);
      }
      toast.success(`Executed: ${cmd}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Command failed';
      toast.error(msg);
    } finally {
      setIsSendingCommand(false);
    }
  };

  const handleDeployNow = async () => {
    setIsDeploying(true);
    try {
      await api.restartBot(bot.id);
      toast.success('Deployed latest commit & restarted bot', 'Deploy Success');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deploy failed';
      toast.error(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  const serverIp = systemStatus?.serverIp || '193.70.34.101';
  const serverPort = bot.id === 'bot-1' ? '20039' : '20040';

  const ramUsedMB = bot.ramUsageMB || 0;
  const ramLimitMB = bot.ramLimitMB || 1515; // ~1.48 GiB default
  const ramPercent = Math.min(100, Math.round((ramUsedMB / ramLimitMB) * 100));

  const storageUsedMB = bot.storageUsedMB || 553;
  const storageLimitMB = bot.storageLimitMB || 4096; // 4 GiB default
  const storagePercent = Math.min(100, Math.round((storageUsedMB / storageLimitMB) * 100));

  return (
    <div className="space-y-4">
      {/* 1. RUNTIME BANNER */}
      <div className="forge-card p-6 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
            RUNTIME
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            Node.js 24
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            node {bot.path}/index.js
          </p>
        </div>

        <ForgeHexagon size={68} />
      </div>

      {/* 2. 4 METRICS CARDS IN A ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="forge-card p-4">
          <span className="text-xs text-slate-400 font-medium">CPU usage</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {bot.status === 'online' ? `${bot.cpuUsage || '0.47'}%` : '0.00%'} <span className="text-slate-500 text-sm font-normal">/ 150%</span>
          </div>
          <div className="mt-3 h-1 w-full bg-[#1F2128] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FACC15] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (bot.cpuUsage || 0.47) * 2)}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="forge-card p-4">
          <span className="text-xs text-slate-400 font-medium">Memory usage</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {bot.status === 'online' ? `${ramUsedMB.toFixed(2)} MiB` : '0 MiB'} <span className="text-slate-500 text-sm font-normal">/ {(ramLimitMB / 1024).toFixed(2)} GiB</span>
          </div>
          <div className="mt-3 h-1 w-full bg-[#1F2128] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FACC15] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, ramPercent)}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="forge-card p-4">
          <span className="text-xs text-slate-400 font-medium">Disk usage</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {storageUsedMB.toFixed(2)} MiB <span className="text-slate-500 text-sm font-normal">/ {(storageLimitMB / 1024).toFixed(0)} GiB</span>
          </div>
          <div className="mt-3 h-1 w-full bg-[#1F2128] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FACC15] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(8, storagePercent)}%` }}
            />
          </div>
        </div>

        {/* Network */}
        <div className="forge-card p-4">
          <span className="text-xs text-slate-400 font-medium">Network in / out</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            1.04 GiB
          </div>
          <div className="text-xs font-mono text-slate-400 mt-2">
            183.5 MiB outbound
          </div>
        </div>
      </div>

      {/* 3. SERVER INFO & GITHUB ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Server Info Card */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">Server info</h3>
          
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold font-mono text-[11px] border border-emerald-500/20">
                {bot.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Uptime</span>
              <span className="text-slate-200 font-mono">
                {bot.status === 'online' ? formatUptime(bot.uptime) : '0m'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Address</span>
              <span className="text-slate-200 font-mono">{serverIp}:{serverPort}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Node</span>
              <span className="text-slate-200 font-mono">GRA-N57 &middot; Premium</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server ID</span>
              <span className="text-slate-200 font-mono">{bot.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* GitHub Card */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">GitHub</h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold font-mono text-[11px] border border-emerald-500/20">
              Connected
            </span>
          </div>

          <div className="pt-1">
            <div className="text-xs font-mono text-slate-200">
              [your-username]/{bot.id}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              Branch main &middot; last deploy a1b2c3d, 2 minutes ago
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <input
              type="checkbox"
              id="dashboard-auto-deploy"
              checked={autoDeploy}
              onChange={(e) => setAutoDeploy(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#0D0E12] border-[#22242B] accent-[#FACC15] cursor-pointer"
            />
            <label htmlFor="dashboard-auto-deploy" className="text-xs text-slate-300 select-none cursor-pointer">
              Auto-deploy on push
            </label>
          </div>

          <div className="pt-1 flex items-center gap-2.5">
            <button
              onClick={handleDeployNow}
              disabled={isDeploying}
              className="forge-btn-primary text-xs py-1.5 px-3.5"
            >
              {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              <span>Deploy now</span>
            </button>

            <button
              onClick={() => onTabChange && onTabChange('github')}
              className="forge-btn-dark text-xs py-1.5 px-3.5"
            >
              <span>Manage</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONSOLE CARD */}
      <div className="forge-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">Console</h3>

        {/* Terminal Window */}
        <div className="rounded-lg bg-[#0D0E12] border border-[#1E2027] p-3.5 font-mono text-xs h-48 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-500">Waiting for live process events...</div>
          ) : (
            logs.slice(-10).map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 shrink-0">
                  {l.type === 'ERROR' ? '[ERROR]' : l.type === 'WARN' ? '[WARN]' : '[BOT]'}
                </span>
                <span className="text-slate-300">{l.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Command Input */}
        <form onSubmit={handleSendCommand} className="relative">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type a command..."
            className="w-full bg-[#0D0E12] text-white placeholder-slate-500 px-3.5 py-2 text-xs font-mono rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#FACC15] transition-colors"
          />
        </form>
      </div>
    </div>
  );
}
