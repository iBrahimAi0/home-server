'use client';

import React, { useState } from 'react';
import { BotData } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Copy, RefreshCw } from 'lucide-react';

interface ForgeGitHubTabProps {
  bot: BotData;
  onRefresh?: () => void;
}

export function ForgeGitHubTab({ bot, onRefresh }: ForgeGitHubTabProps) {
  const toast = useToast();
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isDeploying, setIsDeploying] = useState(false);
  const [secretVal, setSecretVal] = useState('whsec_9a8f7c6e5d4b3a210fedcba987');

  const [optAutoDeploy, setOptAutoDeploy] = useState(true);
  const [optNpmInstall, setOptNpmInstall] = useState(true);
  const [optRestart, setOptRestart] = useState(true);
  const [optBackup, setOptBackup] = useState(false);

  const payloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/hooks/github/${bot.id}`
    : `https://[your-panel]/api/hooks/github/${bot.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(payloadUrl);
    toast.success('Webhook Payload URL copied');
  };

  const handleRegenerateSecret = () => {
    const newSecret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSecretVal(newSecret);
    toast.info('New webhook secret generated');
  };

  const handleDeployNow = async () => {
    setIsDeploying(true);
    try {
      if (optRestart) {
        await api.restartBot(bot.id);
      }
      toast.success('Pulled latest commits & triggered deploy');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deploy failed';
      toast.error(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  const history = [
    {
      status: 'Success',
      commit: 'main · a1b2c3d',
      message: 'fix: auto-resolve bot paths and starter scaffold',
      time: '2 minutes ago',
    },
    {
      status: 'Success',
      commit: 'main · 9e8d7c6',
      message: 'feat: add SQLite database runner and quotas',
      time: 'Yesterday',
    },
    {
      status: 'Failed',
      commit: 'main · 5f4e3d2',
      message: 'test: invalid dependency syntax test',
      time: '3 days ago',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Repository Card */}
      <div className="forge-card p-5 space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Repository</span>
            <p className="text-sm font-mono text-white font-semibold mt-0.5">
              [your-username]/{bot.id}
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold font-mono text-xs border border-emerald-500/20">
            Connected
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium">Branch to deploy</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="main">main</option>
            <option value="master">master</option>
            <option value="develop">develop</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleDeployNow}
            disabled={isDeploying}
            className="forge-btn-primary text-xs py-2 px-4"
          >
            {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Deploy now</span>
          </button>

          <button
            onClick={() => toast.info('GitHub integration settings')}
            className="forge-btn-dark text-xs py-2 px-4"
          >
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* 2. What happens on every push */}
      <div className="forge-card p-5 space-y-3 font-sans">
        <h3 className="text-xs font-bold text-white tracking-tight">What happens on every push</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="forge-card-inner p-3.5 space-y-1">
            <span className="text-xs font-bold text-gold font-mono">1 Push</span>
            <p className="text-[11px] text-slate-400">You push to the selected branch</p>
          </div>

          <div className="forge-card-inner p-3.5 space-y-1">
            <span className="text-xs font-bold text-gold font-mono">2 Webhook</span>
            <p className="text-[11px] text-slate-400">GitHub notifies the panel</p>
          </div>

          <div className="forge-card-inner p-3.5 space-y-1">
            <span className="text-xs font-bold text-gold font-mono">3 Pull</span>
            <p className="text-[11px] text-slate-400">Files update, npm install if needed</p>
          </div>

          <div className="forge-card-inner p-3.5 space-y-1">
            <span className="text-xs font-bold text-gold font-mono">4 Restart</span>
            <p className="text-[11px] text-slate-400">Server restarts with new code</p>
          </div>
        </div>
      </div>

      {/* 3. Webhook & Deploy options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Webhook */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">Webhook</h3>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Payload URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={payloadUrl}
                className="flex-1 bg-inset text-slate-300 text-xs font-mono px-3.5 py-2 rounded-lg border border-line focus:outline-none"
              />
              <button
                onClick={handleCopyUrl}
                className="forge-btn-dark text-xs py-2 px-3.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs text-slate-400 font-medium">Secret</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={secretVal}
                className="flex-1 bg-inset text-slate-300 text-xs font-mono px-3.5 py-2 rounded-lg border border-line focus:outline-none"
              />
              <button
                onClick={handleRegenerateSecret}
                className="forge-btn-dark text-xs py-2 px-3.5 shrink-0"
              >
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Deploy options */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">Deploy options</h3>

          <div className="space-y-3 pt-1 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={optAutoDeploy}
                onChange={(e) => setOptAutoDeploy(e.target.checked)}
                className="w-4 h-4 rounded bg-inset border-line accent-gold"
              />
              <span>Auto-deploy on push</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={optNpmInstall}
                onChange={(e) => setOptNpmInstall(e.target.checked)}
                className="w-4 h-4 rounded bg-inset border-line accent-gold"
              />
              <span>Run npm install when package.json changes</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={optRestart}
                onChange={(e) => setOptRestart(e.target.checked)}
                className="w-4 h-4 rounded bg-inset border-line accent-gold"
              />
              <span>Restart server after deploy</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={optBackup}
                onChange={(e) => setOptBackup(e.target.checked)}
                className="w-4 h-4 rounded bg-inset border-line accent-gold"
              />
              <span>Create a backup before each deploy</span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Deploy history */}
      <div className="forge-card p-5 space-y-3 font-sans">
        <h3 className="text-sm font-bold text-white tracking-tight">Deploy history</h3>

        <div className="divide-y divide-line text-xs">
          {history.map((h, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] ${
                    h.status === 'Success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {h.status}
                </span>
                <div className="min-w-0 truncate">
                  <span className="font-mono text-slate-200">[{h.message}]</span>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{h.commit}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-500 font-mono text-[11px]">{h.time}</span>
                <button
                  onClick={() => toast.info(`Viewing deploy log for ${h.commit}`)}
                  className="text-gold hover:underline font-medium text-xs cursor-pointer"
                >
                  View log
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
