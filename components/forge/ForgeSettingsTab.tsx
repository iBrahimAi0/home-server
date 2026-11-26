'use client';

import React, { useState } from 'react';
import { BotData, SystemStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface ForgeSettingsTabProps {
  bot: BotData;
  systemStatus: SystemStatus | null;
  onRefresh?: () => void;
}

export function ForgeSettingsTab({ bot, systemStatus, onRefresh }: ForgeSettingsTabProps) {
  const toast = useToast();
  const [name, setName] = useState(bot.name);
  const [description, setDescription] = useState(bot.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isReinstalling, setIsReinstalling] = useState(false);

  const serverIp = systemStatus?.serverIp || '193.70.34.101';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateBot(bot.id, {
        name,
        description,
      });
      toast.success('Server settings saved successfully');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReinstall = async () => {
    if (!confirm('Reinstalling will stop the bot process and reinstall all package dependencies. Continue?')) {
      return;
    }
    setIsReinstalling(true);
    try {
      await api.installDependencies(bot.id);
      await api.restartBot(bot.id);
      toast.success('Server reinstalled and restarted successfully');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reinstall failed';
      toast.error(msg);
    } finally {
      setIsReinstalling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* General Settings */}
        <div className="forge-card p-5 space-y-4 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">General</h3>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Server name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Server notes and description..."
                className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2 rounded-lg border border-line focus:outline-none focus:border-gold resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="forge-btn-primary text-xs py-2 px-5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save</span>
            </button>
          </form>
        </div>

        {/* SFTP Info */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">SFTP</h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Host</label>
              <input
                type="text"
                readOnly
                value={serverIp}
                className="w-full bg-inset text-slate-300 text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Username</label>
              <input
                type="text"
                readOnly
                value={`[username].${bot.id.slice(0, 8)}`}
                className="w-full bg-inset text-slate-300 text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              Use your account password to sign in.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Debug Info */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">Debug info</h3>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Node</span>
              <span className="text-slate-200">GRA-N57 &middot; Premium</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server ID</span>
              <span className="text-slate-200">{bot.id}</span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="forge-card p-5 space-y-3 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">Danger zone</h3>

          <p className="text-xs text-slate-400">
            Reinstalling stops the server and re-runs the install script. Files may be replaced.
          </p>

          <button
            onClick={handleReinstall}
            disabled={isReinstalling}
            className="px-4 py-2 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isReinstalling ? 'Reinstalling...' : 'Reinstall server'}
          </button>
        </div>
      </div>
    </div>
  );
}
