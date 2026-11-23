"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BotData, SystemStatus as SystemStatusType } from "@/lib/types";
import { api } from "@/lib/api";
import { realtime } from "@/lib/socket";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ForgeDashboardTab } from "@/components/forge/ForgeDashboardTab";
import { Loader2 } from "lucide-react";

export default function RootDashboardPage() {
  const router = useRouter();
  const [bots, setBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [sys, botList] = await Promise.all([
          api.getSystemStatus().catch(() => null),
          api.getBots().catch(() => []),
        ]);

        if (!isMounted) return;
        if (sys) setSystemStatus(sys);
        if (botList) setBots(botList);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    realtime.connect();

    const unsubSys = realtime.on<SystemStatusType>("system_metrics_update", (status) => {
      if (isMounted) setSystemStatus(status);
    });

    const unsubBots = realtime.on<BotData[]>("bots_metrics_update", (updatedBots) => {
      if (isMounted) setBots(updatedBots);
    });

    return () => {
      isMounted = false;
      unsubSys();
      unsubBots();
    };
  }, []);

  const fallbackBot: BotData = {
    id: "bot-1",
    name: "Role Bot",
    description: "Discord Bot Node.js Container",
    path: "/home/ibra/home-server/bots/bot-1",
    command: "npm",
    args: ["start"],
    autoStart: true,
    status: "online",
    cpuUsage: 12.4,
    ramUsageMB: 184,
    ramLimitMB: 512,
    storageUsedMB: 48,
    storageLimitMB: 1024,
    uptime: 14200,
    restartCount: 0,
  };

  const defaultBot = (bots.length > 0 ? bots[0] : null) || fallbackBot;

  const handleTabChange = (tab: string) => {
    const targetId = defaultBot?.id || "bot-1";
    router.push(`/bots/${targetId}?tab=${tab}`);
  };

  const handleRefresh = async () => {
    try {
      const [sys, botList] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getBots().catch(() => []),
      ]);
      if (sys) setSystemStatus(sys);
      if (botList) setBots(botList);
    } catch {}
  };

  return (
    <div className="flex min-h-screen bg-[#0D0E12] text-slate-100 font-sans">
      <Sidebar
        currentBotId={defaultBot?.id || "bot-1"}
        activeTab="overview"
        onTabChange={handleTabChange}
        bots={bots}
        onRefresh={handleRefresh}
      />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-200">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Header
            title="Dashboard"
            badge={<span>Deployed from main &middot; a1b2c3d &middot; 2m ago</span>}
          />

          {loading ? (
            <div className="py-24 flex items-center justify-center text-slate-500 font-mono text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#F5A623]" />
              <span>Connecting to server container...</span>
            </div>
          ) : !defaultBot ? (
            <div className="forge-card p-10 text-center space-y-3">
              <h2 className="text-base font-bold text-white">No Server Configured</h2>
              <p className="text-xs text-slate-400 font-mono">
                No active bot entry was found in configuration.
              </p>
            </div>
          ) : (
            <ForgeDashboardTab
              bot={defaultBot}
              systemStatus={systemStatus}
              onRefresh={handleRefresh}
              onTabChange={handleTabChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
