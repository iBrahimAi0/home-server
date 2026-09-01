'use client';

import React, { useState } from 'react';
import { Play, Square, RotateCw, Loader2 } from 'lucide-react';
import { BotStatus } from '@/lib/types';
import { api } from '@/lib/api';

interface BotControlsProps {
  botId: string;
  botName: string;
  status: BotStatus;
  onActionStart?: (action: 'start' | 'stop' | 'restart') => void;
  onActionSuccess?: (action: 'start' | 'stop' | 'restart', message?: string) => void;
  onActionError?: (action: 'start' | 'stop' | 'restart', error: string) => void;
  compact?: boolean;
}

export function BotControls({
  botId,
  botName,
  status,
  onActionStart,
  onActionSuccess,
  onActionError,
  compact = false,
}: BotControlsProps) {
  const [loadingAction, setLoadingAction] = useState<'start' | 'stop' | 'restart' | null>(null);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    if (loadingAction) return;

    setLoadingAction(action);
    if (onActionStart) onActionStart(action);

    try {
      let res;
      if (action === 'start') {
        res = await api.startBot(botId);
      } else if (action === 'stop') {
        res = await api.stopBot(botId);
      } else {
        res = await api.restartBot(botId);
      }

      if (onActionSuccess) {
        onActionSuccess(action, res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      if (onActionError) {
        onActionError(action, msg);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const isOnline = status === 'online';
  const isOffline = status === 'offline';
  const isStarting = status === 'starting';
  const isStopping = status === 'stopping';
  const isBusy = isStarting || isStopping || loadingAction !== null;

  return (
    <div id={`bot-controls-${botId}`} className="flex items-center gap-2 flex-wrap">
      {/* Start Button */}
      <button
        id={`btn-start-${botId}`}
        onClick={() => handleAction('start')}
        disabled={isOnline || isStarting || isBusy}
        aria-label={`Start ${botName}`}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all shadow-sm ${
          compact ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2 text-sm gap-2'
        } ${
          isOnline || isStarting || isBusy
            ? 'bg-emerald-950/30 text-emerald-700/50 border border-emerald-900/30 cursor-not-allowed'
            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 active:scale-95'
        }`}
      >
        {loadingAction === 'start' || isStarting ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current" />
        )}
        <span>Start</span>
      </button>

      {/* Stop Button */}
      <button
        id={`btn-stop-${botId}`}
        onClick={() => handleAction('stop')}
        disabled={isOffline || isStopping || isBusy}
        aria-label={`Stop ${botName}`}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all shadow-sm ${
          compact ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2 text-sm gap-2'
        } ${
          isOffline || isStopping || isBusy
            ? 'bg-rose-950/30 text-rose-700/50 border border-rose-900/30 cursor-not-allowed'
            : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 active:scale-95'
        }`}
      >
        {loadingAction === 'stop' || isStopping ? (
          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
        ) : (
          <Square className="w-3.5 h-3.5 fill-current" />
        )}
        <span>Stop</span>
      </button>

      {/* Restart Button */}
      <button
        id={`btn-restart-${botId}`}
        onClick={() => handleAction('restart')}
        disabled={isOffline || isBusy}
        aria-label={`Restart ${botName}`}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all shadow-sm ${
          compact ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2 text-sm gap-2'
        } ${
          isOffline || isBusy
            ? 'bg-indigo-950/30 text-indigo-700/50 border border-indigo-900/30 cursor-not-allowed'
            : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50 active:scale-95'
        }`}
      >
        {loadingAction === 'restart' ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        ) : (
          <RotateCw className="w-3.5 h-3.5" />
        )}
        <span>Restart</span>
      </button>
    </div>
  );
}
