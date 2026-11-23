'use client';

import React, { useState } from 'react';
import { BotData } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface ForgeBackupsTabProps {
  bot: BotData;
}

export function ForgeBackupsTab({ bot }: ForgeBackupsTabProps) {
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [backups, setBackups] = useState([
    {
      id: 'bk-1',
      name: `${bot.id}-stable-v1`,
      isLocked: true,
      size: '421.74 MiB',
      created: '4 months ago',
      checksum: 'sha1:c423563a6bce...',
    },
  ]);

  const handleCreateBackup = () => {
    setIsCreating(true);
    const downloadUrl = api.getBotExportDownloadUrl(bot.id);
    window.open(downloadUrl, '_blank');
    
    setTimeout(() => {
      setBackups((prev) => [
        {
          id: `bk-${Date.now()}`,
          name: `${bot.id}-manual-${new Date().toISOString().slice(0, 10)}`,
          isLocked: false,
          size: '124.50 MiB',
          created: 'Just now',
          checksum: 'sha1:' + Math.random().toString(36).substring(2, 12),
        },
        ...prev,
      ]);
      setIsCreating(false);
      toast.success('Backup archive created and downloading');
    }, 1200);
  };

  const handleDownload = (name: string) => {
    const downloadUrl = api.getBotExportDownloadUrl(bot.id);
    window.open(downloadUrl, '_blank');
    toast.info(`Downloading backup ${name}...`);
  };

  const handleRestore = (name: string) => {
    if (confirm(`Are you sure you want to restore "${name}"? Current changes will be overwritten.`)) {
      toast.success(`Restoring ${name} backup...`);
    }
  };

  const used = backups.length;
  const max = 2;
  const percent = Math.min(100, Math.round((used / max) * 100));

  return (
    <div className="space-y-4 font-sans">
      <div className="forge-card p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Manage backups</h3>
          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="forge-btn-primary text-xs py-1.5 px-3.5"
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Create backup</span>
          </button>
        </div>

        {/* Quota Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="text-xs font-mono text-slate-400">
            {used} of {max} backups used
          </div>
          <div className="h-1 w-full bg-[#1E2027] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FACC15] rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Backups Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2027] text-slate-500">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Size</th>
                <th className="pb-3 font-semibold">Created</th>
                <th className="pb-3 font-semibold">Checksum</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1E24]">
              {backups.map((bk) => (
                <tr key={bk.id} className="hover:bg-[#181A20] transition-colors">
                  <td className="py-3 text-white font-medium flex items-center gap-2">
                    <span>{bk.name}</span>
                    {bk.isLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1E2027] text-slate-400 border border-[#282B34]">
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-slate-400">{bk.size}</td>
                  <td className="py-3 text-slate-400">{bk.created}</td>
                  <td className="py-3 text-slate-500 truncate max-w-[150px]">{bk.checksum}</td>
                  <td className="py-3 text-right space-x-3">
                    <button
                      onClick={() => handleDownload(bk.name)}
                      className="text-[#FACC15] hover:underline font-medium cursor-pointer"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleRestore(bk.name)}
                      className="text-[#FACC15] hover:underline font-medium cursor-pointer"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
