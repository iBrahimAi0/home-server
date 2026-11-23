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
    <div id={`bot-controls-${botId}`} className="flex items-center gap-1.5 flex-wrap">
      {/* Start Button */}
      <button
        id={`btn-start-${botId}`}
        onClick={() => handleAction('start')}
        disabled={isOnline || isStarting || isBusy}
        aria-label={`Start ${botName}`}
        className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 ${
          compact ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3.5 py-1.5 text-xs gap-2'
        } ${
          isOnline || isStarting || isBusy
            ? 'opacity-40 bg-emerald-950/20 text-emerald-600 border border-emerald-900/30 cursor-not-allowed'
            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer'
        }`}
      >
        {loadingAction === 'start' || isStarting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        ) : (
          <Play className="w-3 h-3 fill-current" />
        )}
        <span>Start</span>
      </button>

      {/* Stop Button */}
      <button
        id={`btn-stop-${botId}`}
        onClick={() => handleAction('stop')}
        disabled={isOffline || isStopping || isBusy}
        aria-label={`Stop ${botName}`}
        className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 ${
          compact ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3.5 py-1.5 text-xs gap-2'
        } ${
          isOffline || isStopping || isBusy
            ? 'opacity-40 bg-rose-950/20 text-rose-600 border border-rose-900/30 cursor-not-allowed'
            : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 hover:shadow-[0_0_12px_rgba(244,63,94,0.25)] active:scale-95 cursor-pointer'
        }`}
      >
        {loadingAction === 'stop' || isStopping ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
        ) : (
          <Square className="w-3 h-3 fill-current" />
        )}
        <span>Stop</span>
      </button>

      {/* Restart Button */}
      <button
        id={`btn-restart-${botId}`}
        onClick={() => handleAction('restart')}
        disabled={isOffline || isBusy}
        aria-label={`Restart ${botName}`}
        className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 ${
          compact ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3.5 py-1.5 text-xs gap-2'
        } ${
          isOffline || isBusy
            ? 'opacity-40 bg-indigo-950/20 text-indigo-600 border border-indigo-900/30 cursor-not-allowed'
            : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] active:scale-95 cursor-pointer'
        }`}
      >
        {loadingAction === 'restart' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        ) : (
          <RotateCw className="w-3 h-3" />
        )}
        <span>Restart</span>
      </button>
    </div>
  );
}
