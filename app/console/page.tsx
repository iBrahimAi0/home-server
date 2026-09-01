'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Radio } from 'lucide-react';
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
    <div className="flex min-h-screen bg-[#0B0D13]">
      <Sidebar
        serverStatus={systemStatus?.status || 'online'}
        serverUptime={systemStatus?.uptime}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header
          title="Live Server Console"
          subtitle="Real-time terminal stream, output logs, and debugging monitor"
          bots={bots}
          systemStatus={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-[#121722] border border-[#1E273A] p-3.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-white text-xs font-mono">Real-time Event Stream Active</span>
                <p className="text-slate-400 text-[11px] font-mono">
                  Streaming standard output and standard error from active bot processes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sanitized stdout/stderr stream</span>
            </div>
          </div>

          {/* Full Screen Terminal Component */}
          <Terminal
            initialBotId={requestedBot}
            bots={bots}
            heightClass="h-[calc(100vh-270px)] min-h-[500px]"
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
      <div className="flex min-h-screen bg-[#0B0D13] items-center justify-center text-slate-400 font-mono text-xs">
        Loading console...
      </div>
    }>
      <ConsoleContent />
    </Suspense>
  );
}
