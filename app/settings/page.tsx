'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Bot, 
  Cpu, 
  HardDrive, 
  Database, 
  Shield, 
  Code, 
  Copy, 
  Check, 
  Info, 
  FileText,
  Terminal,
  ExternalLink,
  Plus
} from 'lucide-react';
import { BotData, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default function SettingsPage() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
        console.error('Error fetching settings data:', err);
      } finally {
        if (isMounted) {
          setRefreshing(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
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

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleBotsConfig = `[
  {
    "id": "bot-1",
    "name": "Role Bot",
    "path": "/home/ibra/home-server/bots/bot-1",
    "command": "npm",
    "args": ["start"],
    "autoStart": true
  },
  {
    "id": "bot-2",
    "name": "Games Bot",
    "path": "/home/ibra/home-server/bots/bot-2",
    "command": "npm",
    "args": ["start"],
    "autoStart": true
  },
  {
    "id": "bot-3",
    "name": "Music & Utility Bot",
    "path": "/home/ibra/home-server/bots/bot-3",
    "command": "npm",
    "args": ["start"],
    "autoStart": false
  }
]`;

  const systemdCommands = `# ============================================================
# 1. Install & Enable Express Backend Service (:3001)
# ============================================================
sudo cp ~/home-server/dashboard/systemd/home-server-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable home-server-backend
sudo systemctl start home-server-backend

# Check backend status & logs
sudo systemctl status home-server-backend
sudo journalctl -u home-server-backend -f

# ============================================================
# 2. Install & Enable Next.js Frontend Dashboard Service (:3000)
# ============================================================
sudo cp ~/home-server/dashboard/systemd/home-server-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable home-server-dashboard
sudo systemctl start home-server-dashboard

# Check dashboard status & logs
sudo systemctl status home-server-dashboard
sudo journalctl -u home-server-dashboard -f`;

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Server Settings & Configuration"
          subtitle="System properties, bot definitions, systemd service management"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Server Hardware Information */}
          <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 pb-4 border-b border-[#1E293B]">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Ubuntu Server Environment</h3>
                <p className="text-xs text-slate-400">
                  Host hardware, network interfaces, and runtime specifications
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Server Hostname</span>
                <p className="text-sm font-mono font-bold text-white mt-1">
                  {systemStatus?.hostname || 'ubuntu-home-server'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Operating System</span>
                <p className="text-sm font-bold text-white mt-1">
                  Ubuntu Server ({systemStatus?.platform || 'linux'} {systemStatus?.arch || 'x64'})
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Node.js Engine</span>
                <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {systemStatus?.nodeVersion || 'v20.18.0'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Server Local IP</span>
                <p className="text-sm font-mono font-bold text-purple-400 mt-1">
                  {systemStatus?.serverIp || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Memory</span>
                <p className="text-sm font-mono font-bold text-sky-400 mt-1">
                  {systemStatus?.ram.totalGB || 8.0} GB RAM
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Storage</span>
                <p className="text-sm font-mono font-bold text-amber-400 mt-1">
                  {systemStatus?.storage.totalGB || 120.0} GB SSD (Mount: {systemStatus?.storage.mount || '/'})
                </p>
              </div>
            </div>
          </div>

          {/* Configured Bots Safe Overview */}
          <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bot Configurations ({bots.length})</h3>
                  <p className="text-xs text-slate-400">
                    Loaded dynamically from <code className="text-purple-300 font-mono">backend/config/bots.json</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Table of bots */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Bot ID</th>
                    <th className="pb-3 pr-4">Display Name</th>
                    <th className="pb-3 pr-4">Server Directory Path</th>
                    <th className="pb-3 pr-4">Command</th>
                    <th className="pb-3 pr-4">Auto-Start</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60 font-mono">
                  {bots.map((bot) => (
                    <tr key={bot.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pr-4 text-purple-400 font-bold">{bot.id}</td>
                      <td className="py-3.5 pr-4 text-white font-sans font-semibold">{bot.name}</td>
                      <td className="py-3.5 pr-4 text-slate-300 truncate max-w-xs">{bot.path}</td>
                      <td className="py-3.5 pr-4 text-slate-400">{bot.command} {bot.args.join(' ')}</td>
                      <td className="py-3.5 pr-4">
                        {bot.autoStart ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            true
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
                            false
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-sans">
                        <span className="capitalize font-semibold text-slate-300">
                          {bot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Security Guarantee Note */}
            <div className="mt-5 rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5 flex items-start gap-3 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Security Isolation Guarantee: </span>
                <span>
                  Discord bot tokens, local <code className="text-slate-300">.env</code> files, MongoDB connection strings, and arbitrary shell execution endpoints are never exposed through this dashboard or its APIs.
                </span>
              </div>
            </div>
          </div>

          {/* Guide: Adding Bot 2 and Bot 3 to bots.json */}
          <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">How to Add New Discord Bots</h3>
                  <p className="text-xs text-slate-400">
                    No code changes required — simply add an entry to <code className="text-purple-300 font-mono">backend/config/bots.json</code>
                  </p>
                </div>
              </div>

              <button
                id="btn-copy-bots-config"
                onClick={() => handleCopy('botsJson', sampleBotsConfig)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copiedKey === 'botsJson' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4">
              <pre className="p-4 rounded-xl bg-[#090D16] border border-[#1E293B] text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {sampleBotsConfig}
              </pre>
            </div>
          </div>

          {/* systemd Service Setup & Management */}
          <div className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Ubuntu systemd Background Service</h3>
                  <p className="text-xs text-slate-400">
                    Keeps bots and dashboard running 24/7 even if SSH, browser, or PC closes
                  </p>
                </div>
              </div>

              <button
                id="btn-copy-systemd-cmds"
                onClick={() => handleCopy('systemd', systemdCommands)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copiedKey === 'systemd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Commands!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4">
              <pre className="p-4 rounded-xl bg-[#090D16] border border-[#1E293B] text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
                {systemdCommands}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
