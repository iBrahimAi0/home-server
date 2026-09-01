'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitBranch, 
  GitCommit as GitCommitIcon, 
  RefreshCw, 
  GitPullRequest, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Settings, 
  Clock, 
  User, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { GitStatus, GitUpdateCheckResult } from '@/lib/types';
import { PullConfirmModal } from './PullConfirmModal';

interface GitHubSyncProps {
  botId: string;
  botName: string;
  botPath: string;
}

export function GitHubSync({ botId, botName, botPath }: GitHubSyncProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [updateInfo, setUpdateInfo] = useState<GitUpdateCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Configuration modal state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [repoUrlInput, setRepoUrlInput] = useState('');
  const [branchInput, setBranchInput] = useState('main');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Pull confirmation modal
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getGitStatus(botId);
      setStatus(data);
      if (data.remoteUrl) {
        setRepoUrlInput(data.remoteUrl);
      }
      if (data.branch) {
        setBranchInput(data.branch);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch git status.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleCheckUpdates = async () => {
    if (!status || !status.isGitRepo) return;
    setIsChecking(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await api.checkGitUpdates(botId, status.branch || 'main');
      setUpdateInfo(result);
      if (result.hasUpdates) {
        setSuccessMsg(`Updates available: ${result.commitsBehind} new commit(s) on remote.`);
      } else {
        setSuccessMsg('Repository is up to date with remote.');
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to check updates.';
      setError(msg);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrlInput.trim()) return;

    setIsSavingConfig(true);
    setError(null);

    try {
      await api.configureGitRepo(botId, repoUrlInput.trim(), branchInput.trim() || 'main');
      setIsConfigOpen(false);
      await fetchStatus();
      setSuccessMsg('Git repository configured successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to configure repository.';
      setError(msg);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Git Overview Card */}
      <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E273A]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">GitHub Synchronization</h3>
                {status?.isGitRepo && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                    Branch: {status.branch || 'main'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xl">
                {status?.remoteUrl || 'No remote GitHub repository configured yet'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-200 border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Configure</span>
            </button>

            {status?.isGitRepo && (
              <>
                <button
                  id="btn-git-check-updates"
                  onClick={handleCheckUpdates}
                  disabled={isChecking || isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-200 border border-[#232E44] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Updates'}</span>
                </button>

                <button
                  id="btn-git-pull-updates"
                  onClick={() => setIsPullModalOpen(true)}
                  disabled={isChecking || isLoading || !status.isClean}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Pull Updates</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Configure Repository Form */}
        {isConfigOpen && (
          <form onSubmit={handleSaveConfig} className="mt-4 p-4 rounded-md bg-[#0C1018] border border-[#1E273A] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-xs">Configure Remote Repository</h4>
              <span className="text-[10px] text-slate-500 font-mono">Restricted Git Service</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-mono font-semibold text-slate-400 mb-1">
                  Repository URL (HTTPS)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/owner/repo.git"
                  value={repoUrlInput}
                  onChange={(e) => setRepoUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-[#121722] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-semibold text-slate-400 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  required
                  placeholder="main"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-[#121722] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-[#182030] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingConfig || !repoUrlInput.trim()}
                className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}

        {/* Repository State Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Inspecting Git status...</span>
          </div>
        ) : !status?.isGitRepo ? (
          <div className="mt-4 p-8 text-center bg-[#0C1018] rounded-md border border-[#1A2232] space-y-2">
            <GitBranch className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
            <h4 className="text-sm font-semibold text-white">No Git Repository Linked</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Link this bot directory to a GitHub repository to enable 1-click update checks and safe pulls.
            </p>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
            >
              <span>Configure Repository</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Uncommitted Local Changes Warning */}
            {!status.isClean && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Local Uncommitted Modifications Detected ({status.modifiedFilesCount} files):</strong>
                  <p className="text-amber-200/80 mt-0.5">
                    Git pull is disabled until local changes are committed or stashed to prevent overwriting your local work.
                  </p>
                </div>
              </div>
            )}

            {/* Current Commit Details Card */}
            <div className="p-4 rounded-md bg-[#0C1018] border border-[#1A2232] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <GitCommitIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Current Active Commit
                </span>
                {status.currentCommit?.shortHash && (
                  <span className="font-bold text-indigo-400 px-2 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {status.currentCommit.shortHash}
                  </span>
                )}
              </div>

              {status.currentCommit ? (
                <div>
                  <p className="text-sm font-semibold text-white font-mono">
                    {status.currentCommit.message}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400 font-mono flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{status.currentCommit.author}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(status.currentCommit.date)}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-mono">No commit history found.</p>
              )}
            </div>

            {/* Updates Inspection Panel if check performed */}
            {updateInfo && (
              <div className="p-4 rounded-md bg-[#0C1018] border border-[#1A2232] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1A2232]">
                  <div className="flex items-center gap-2">
                    {updateInfo.hasUpdates ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        {updateInfo.commitsBehind} Update(s) Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Up to Date with origin/{status.branch || 'main'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Checked: {formatDate(updateInfo.checkedAt)}
                  </span>
                </div>

                {/* Incoming Commits List */}
                {updateInfo.incomingCommits && updateInfo.incomingCommits.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold block">
                      Incoming Commits ({updateInfo.incomingCommits.length}):
                    </span>
                    <div className="space-y-1 font-mono text-xs">
                      {updateInfo.incomingCommits.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#121722] border border-[#1E273A]">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-indigo-400 font-bold shrink-0">{c.shortHash}</span>
                            <span className="text-slate-200 truncate">{c.message}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{c.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Changed Files List */}
                {updateInfo.changedFiles && updateInfo.changedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold block">
                      Changed Files ({updateInfo.changedFiles.length}):
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
                      {updateInfo.changedFiles.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-300">
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              f.status === 'M'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : f.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {f.status}
                          </span>
                          <span className="truncate">{f.file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Guarantee Banner */}
      <div className="p-3.5 rounded-lg bg-[#121722] border border-[#1E273A] flex items-start gap-2.5 text-xs text-slate-400 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Zero-Arbitrary Execution Policy: </span>
          <span>
            Git operations are executed exclusively through restricted parameterized server services with fast-forward verification. Tokens, SSH keys, and credentials are never transmitted to the browser.
          </span>
        </div>
      </div>

      {/* Pull Confirmation Modal */}
      <PullConfirmModal
        botId={botId}
        botName={botName}
        branch={status?.branch || 'main'}
        updateInfo={updateInfo}
        isOpen={isPullModalOpen}
        onClose={() => setIsPullModalOpen(false)}
        onPulled={async () => {
          await fetchStatus();
          setUpdateInfo(null);
          setSuccessMsg('Successfully pulled latest updates from GitHub.');
        }}
      />
    </div>
  );
}