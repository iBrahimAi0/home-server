'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Bot, 
  Shield, 
  Code, 
  Copy, 
  Check, 
  Terminal,
  Key
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

  const systemdCommands = `# 1. Install & Enable NexusPanel Express Backend (:3001)
sudo cp ~/home-server/systemd/nexuspanel-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nexuspanel-backend
sudo systemctl start nexuspanel-backend

# Check backend status & live journal logs
sudo systemctl status nexuspanel-backend
sudo journalctl -u nexuspanel-backend -f

# 2. Install & Enable NexusPanel Next.js Frontend (:3000)
sudo cp ~/home-server/systemd/nexuspanel-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nexuspanel-dashboard
sudo systemctl start nexuspanel-dashboard

# Check dashboard status
sudo systemctl status nexuspanel-dashboard`;

  return (
    <div className="flex min-h-screen bg-[#0B0D13]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Server Settings & Architecture"
          subtitle="Hardware specifications, bot process configuration, and daemon management"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-5">
          {/* Server Hardware Information */}
          <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E273A]">
              <div className="p-2 rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Ubuntu Server Host Environment</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Hardware telemetry, network interfaces, and Node.js runtime
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Hostname</span>
                <p className="text-xs font-bold text-white mt-0.5">
                  {systemStatus?.hostname || 'ubuntu-home-server'}
                </p>
              </div>

              <div className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Operating System</span>
                <p className="text-xs font-bold text-white mt-0.5">
                  Ubuntu Server ({systemStatus?.platform || 'linux'} {systemStatus?.arch || 'x64'})
                </p>
              </div>

              <div className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Node.js Engine</span>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">
                  {systemStatus?.nodeVersion || 'v20.x'}
                </p>
              </div>

              <div className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Server Local IP</span>
                <p className="text-xs font-bold text-indigo-400 mt-0.5">
                  {systemStatus?.serverIp || '192.168.1.120'}
                </p>
              </div>

              <div className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Memory</span>
                <p className="text-xs font-bold text-sky-400 mt-0.5">
                  {systemStatus?.ram.totalGB || 8.0} GB RAM
                </p>
              </div>

              <div className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Storage</span>
                <p className="text-xs font-bold text-amber-400 mt-0.5">
                  {systemStatus?.storage.totalGB || 120.0} GB SSD
                </p>
              </div>
            </div>
          </div>

          {/* Configured Bots Safe Overview */}
          <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E273A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#182133] border border-[#232E44] text-sky-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Bot Configurations ({bots.length})</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Loaded dynamically from <code className="text-indigo-300">backend/config/bots.json</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Table of bots */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E273A] text-slate-400 font-semibold font-mono text-[11px] uppercase">
                    <th className="pb-2.5 pr-4">Bot ID</th>
                    <th className="pb-2.5 pr-4">Display Name</th>
                    <th className="pb-2.5 pr-4">Server Directory Path</th>
                    <th className="pb-2.5 pr-4">Command</th>
                    <th className="pb-2.5 pr-4">Auto-Start</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030] font-mono text-xs">
                  {bots.map((bot) => (
                    <tr key={bot.id} className="hover:bg-[#151C2A] transition-colors">
                      <td className="py-2.5 pr-4 text-indigo-400 font-bold">{bot.id}</td>
                      <td className="py-2.5 pr-4 text-white font-sans font-semibold">{bot.name}</td>
                      <td className="py-2.5 pr-4 text-slate-300 truncate max-w-xs">{bot.path}</td>
                      <td className="py-2.5 pr-4 text-slate-400">{bot.command} {bot.args.join(' ')}</td>
                      <td className="py-2.5 pr-4">
                        {bot.autoStart ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            true
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            false
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 font-sans">
                        <span className="capitalize font-semibold text-slate-300">
                          {bot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Security Isolation Guarantee Note */}
            <div className="mt-4 rounded-md bg-[#0C1018] border border-[#1A2232] p-3 flex items-start gap-2.5 text-xs text-slate-400 font-mono">
              <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">File Access Policy: </span>
                <span>
                  Full file management — including editing <code className="text-slate-300">.env*</code> files, SSH keys, and other credential files — is available from each bot&apos;s File Manager. All operations are still confined to that bot&apos;s own directory; arbitrary shell terminal execution is never exposed through NexusPanel APIs.
                </span>
              </div>
            </div>
          </div>

          {/* Authentication Token Configuration */}
          <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E273A]">
              <div className="p-2 rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Authentication Middleware Architecture</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Prepare and activate Bearer token / API key security
                </p>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-300 font-mono space-y-2">
              <p>
                To enable API authentication for external access, set the <code className="text-indigo-300">AUTH_TOKEN</code> or <code className="text-indigo-300">API_KEY</code> variable in <code className="text-indigo-300">backend/.env</code>:
              </p>
              <pre className="p-3 rounded-md bg-[#0C1018] border border-[#1A2232] text-indigo-300 text-xs font-mono">
                AUTH_TOKEN=your-secure-random-secret-token
              </pre>
              <p className="text-slate-400 text-[11px]">
                When configured, all file operations, bot lifecycle requests, and Git endpoints require a valid <code className="text-slate-300">Authorization: Bearer &lt;token&gt;</code> or <code className="text-slate-300">x-api-key</code> header.
              </p>
            </div>
          </div>

          {/* Guide: Adding Discord Bots */}
          <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E273A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">How to Add New Discord Bots</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Use the <span className="text-indigo-300">Add Bot</span> button on the Bots page — no manual file editing required. The JSON below is only needed for advanced/manual setups.
                  </p>
                </div>
              </div>

              <button
                id="btn-copy-bots-config"
                onClick={() => handleCopy('botsJson', sampleBotsConfig)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#182030] hover:bg-[#202B40] text-slate-200 border border-[#232E44] transition-colors cursor-pointer"
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

            <div className="mt-3.5">
              <pre className="p-3.5 rounded-md bg-[#0C1018] border border-[#1A2232] text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {sampleBotsConfig}
              </pre>
            </div>
          </div>

          {/* systemd Service Setup */}
          <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E273A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#182133] border border-[#232E44] text-amber-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Ubuntu systemd Background Daemon</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Keeps bots and dashboard running 24/7 persistently
                  </p>
                </div>
              </div>

              <button
                id="btn-copy-systemd-cmds"
                onClick={() => handleCopy('systemd', systemdCommands)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#182030] hover:bg-[#202B40] text-slate-200 border border-[#232E44] transition-colors cursor-pointer"
              >
                {copiedKey === 'systemd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3.5">
              <pre className="p-3.5 rounded-md bg-[#0C1018] border border-[#1A2232] text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
                {systemdCommands}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
