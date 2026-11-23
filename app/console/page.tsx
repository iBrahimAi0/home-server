'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BotData, SystemStatus as SystemStatusType } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ForgeConsoleTab } from '@/components/forge/ForgeConsoleTab';
import { Loader2 } from 'lucide-react';

function ConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedBot = searchParams.get('bot');

  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (isMounted) setLoading(false);
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

  const activeBot = (requestedBot ? bots.find(b => b.id === requestedBot) : null) || bots[0];

  const handleTabChange = (tab: string) => {
    const targetId = activeBot?.id || 'bot-1';
    router.push(`/bots/${targetId}?tab=${tab}`);
  };

  return (
    <div className="flex min-h-screen bg-[#0D0E12] text-slate-100 font-sans">
      <Sidebar
        currentBotId={activeBot?.id || 'bot-1'}
        activeTab="console"
        onTabChange={handleTabChange}
        bots={bots}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-200">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Header title="Console" />

          {loading ? (
            <div className="py-24 flex items-center justify-center text-slate-500 font-mono text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#FACC15]" />
              <span>Connecting to server console...</span>
            </div>
          ) : !activeBot ? (
            <div className="forge-card p-10 text-center space-y-3">
              <h2 className="text-base font-bold text-white">No Server Configured</h2>
            </div>
          ) : (
            <ForgeConsoleTab bot={activeBot} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function ConsolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#0D0E12] items-center justify-center text-slate-400 font-mono text-xs">
          Loading console...
        </div>
      }
    >
      <ConsoleContent />
    </Suspense>
  );
}
