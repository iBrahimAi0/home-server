'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal as TerminalIcon, Bot, Info, ShieldCheck, Radio } from 'lucide-react';
import { BotData, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Terminal } from '@/components/Terminal';

function ConsoleContent() {
  const searchParams = useSearchParams();
  const requestedBot = searchParams.get('bot') || 'all';

  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
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
        console.error('Error fetching console data:', err);
      } finally {
        if (isMounted) {
          setRefreshing(false);
        }
      }
    }

    fetchData();

    realtime.connect();

    const unsubBots = realtime.on<BotData[]>('bots_metrics_update', (updatedBots) => {
      if (isMounted) setBots(updatedBots);
    });

    const unsubSys = realtime.on<SystemStatusType>('system_metrics_update', (status) => {
      if (isMounted) setSystemStatus(status);
    });

    return () => {
      isMounted = false;
      unsubBots();
      unsubSys();
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

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Server Console"
          subtitle="Real-time terminal stream, output logs, and debugging monitor"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Banner with Terminal info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-[#111726]/90 border border-[#1E293B] p-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Live Stream Connected</span>
                <p className="text-slate-400 text-xs">
                  Streaming standard output and standard error from managed processes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sanitized Log Stream &bull; Secret masking active</span>
            </div>
          </div>

          {/* Full Screen / Responsive Terminal Component */}
          <Terminal
            initialBotId={requestedBot}
            bots={bots}
            heightClass="h-[calc(100vh-320px)] min-h-[500px]"
            showBotSelector={true}
          />
        </main>
      </div>
    </div>
  );
}

export default function ConsolePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#0A0E17] items-center justify-center text-slate-400">
        Loading console...
      </div>
    }>
      <ConsoleContent />
    </Suspense>
  );
}
