'use client';

import React, { useState } from 'react';
import { X, GitPullRequest, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { GitUpdateCheckResult } from '@/lib/types';

interface PullConfirmModalProps {
  botId: string;
  botName: string;
  branch: string;
  updateInfo: GitUpdateCheckResult | null;
  isOpen: boolean;
  onClose: () => void;
  onPulled: () => void;
}

export function PullConfirmModal({
  botId,
  botName,
  branch,
  updateInfo,
  isOpen,
  onClose,
  onPulled
}: PullConfirmModalProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePull = async () => {
    setIsPulling(true);
    setError(null);

    try {
      await api.pullGitUpdates(botId, branch);
      onPulled();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Git pull failed.';
      setError(msg);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-lg bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">
              Confirm GitHub Pull
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-md bg-[#0B0E14] border border-[#1E273A] text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Target Bot:</span>
              <strong className="text-white">{botName}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Branch:</span>
              <strong className="text-indigo-400">{branch}</strong>
            </div>
            {updateInfo && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Incoming Commits:</span>
                <strong className="text-emerald-400">{updateInfo.commitsBehind} commit(s)</strong>
              </div>
            )}
          </div>

          {/* Incoming commits preview */}
          {updateInfo && updateInfo.incomingCommits && updateInfo.incomingCommits.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 font-semibold block">
                Incoming Commits to Apply:
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 bg-[#0B0E14] p-2.5 rounded-md border border-[#1E273A] font-mono text-[11px]">
                {updateInfo.incomingCommits.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold shrink-0">{c.shortHash}</span>
                    <span className="text-slate-200 truncate">{c.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold text-white">Safe Fast-Forward:</span>
              <span className="ml-1 text-amber-200/90">
                Updates will be pulled safely via fast-forward only. Uncommitted local files will not be silently overwritten.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E273A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-pull-confirm-submit"
              type="button"
              onClick={handlePull}
              disabled={isPulling}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPulling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitPullRequest className="w-3.5 h-3.5" />
              )}
              <span>{isPulling ? 'Pulling Updates...' : 'Pull Updates Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}