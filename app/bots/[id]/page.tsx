"use client";

import React, { useState, useEffect, Suspense, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BotData, SystemStatus as SystemStatusType } from "@/lib/types";
import { api } from "@/lib/api";
import { realtime } from "@/lib/socket";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ForgeDashboardTab } from "@/components/forge/ForgeDashboardTab";
import { ForgeConsoleTab } from "@/components/forge/ForgeConsoleTab";
import { ForgeSettingsTab } from "@/components/forge/ForgeSettingsTab";
import { ForgeActivityTab } from "@/components/forge/ForgeActivityTab";
import { ForgeFilesTab } from "@/components/forge/ForgeFilesTab";
import { ForgeDatabasesTab } from "@/components/forge/ForgeDatabasesTab";
import { ForgeBackupsTab } from "@/components/forge/ForgeBackupsTab";
import { ForgeAutoBackupsTab } from "@/components/forge/ForgeAutoBackupsTab";
import { ForgeNetworkTab } from "@/components/forge/ForgeNetworkTab";
import { ForgeGitHubTab } from "@/components/forge/ForgeGitHubTab";
import { ForgeSchedulesTab } from "@/components/forge/ForgeSchedulesTab";
import { ForgeUsersTab } from "@/components/forge/ForgeUsersTab";
import { EnvManagerTab } from "@/components/bots/EnvManagerTab";
import { ForgeStartupTab } from "@/components/forge/ForgeStartupTab";
import { Loader2 } from "lucide-react";

type ForgeTabType =
  | "overview"
  | "console"
  | "settings"
  | "activity"
  | "files"
  | "databases"
  | "backups"
  | "auto-backups"
  | "network"
  | "github"
  | "schedules"
  | "users"
  | "startup"
  | "env";

function BotDetailsContent({ botId }: { botId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = (searchParams.get("tab") as ForgeTabType) || "overview";

  // Map legacy tab names if needed
  const normalizedTab: ForgeTabType =
    rawTab === ("logs" as any)
      ? "console"
      : rawTab === ("database" as any)
        ? "databases"
        : rawTab;

  const [activeTab, setActiveTab] = useState<ForgeTabType>(normalizedTab);
  const [bot, setBot] = useState<BotData | null>(null);
  const [allBots, setAllBots] = useState<BotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(normalizedTab);
  }, [normalizedTab]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [botData, botsList, sys] = await Promise.all([
          api.getBot(botId),
          api.getBots().catch(() => []),
          api.getSystemStatus().catch(() => null),
        ]);

        if (!isMounted) return;

        setBot(botData);
        setError(null);
        setAllBots(botsList || []);
        if (sys) setSystemStatus(sys);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load server";
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    realtime.connect();

    const unsubStatus = realtime.on<BotData>("bot_status_changed", (updatedBot) => {
      if (isMounted && updatedBot.id === botId) {
        setBot(updatedBot);
      }
    });

    const unsubMetrics = realtime.on<BotData[]>("bots_metrics_update", (updatedBots) => {
      if (!isMounted) return;
      const match = updatedBots.find((b) => b.id === botId);
      if (match) setBot(match);
      setAllBots(updatedBots);
    });

    return () => {
      isMounted = false;
      unsubStatus();
      unsubMetrics();
    };
  }, [botId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ForgeTabType);
    router.push(`/bots/${botId}?tab=${tab}`);
  };

  const handleRefresh = async () => {
    try {
      const [botData, botsList, sys] = await Promise.all([
        api.getBot(botId),
        api.getBots().catch(() => []),
        api.getSystemStatus().catch(() => null),
      ]);
      if (botData) setBot(botData);
      if (botsList) setAllBots(botsList);
      if (sys) setSystemStatus(sys);
    } catch {}
  };

  const titles: Record<ForgeTabType, string> = {
    overview: "Dashboard",
    console: "Console",
    settings: "Settings",
    activity: "Activity",
    files: "Files",
    databases: "Databases",
    backups: "Backups",
    "auto-backups": "Automatic backups",
    network: "Network",
    github: "GitHub Deploy",
    schedules: "Schedules",
    users: "Users",
    startup: "Startup",
    env: "Environment",
  };

  return (
    <div className="flex min-h-screen bg-inset text-slate-100 font-sans">
      <Sidebar
        currentBotId={botId}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        bots={allBots}
        onRefresh={handleRefresh}
      />

      <div className="min-w-0 flex-1 flex flex-col md:pl-64 transition-all duration-200">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Top Page Header */}
          <Header
            title={titles[activeTab] || "Dashboard"}
            badge={bot?.name}
          />

          {loading ? (
            <div className="py-24 flex items-center justify-center text-slate-500 font-mono text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gold" />
              <span>Connecting to server container...</span>
            </div>
          ) : error || !bot ? (
            <div className="forge-card p-10 text-center space-y-3">
              <h2 className="text-base font-bold text-white">Server Not Found</h2>
              <p className="text-xs text-slate-400 font-mono">{error || "Bot not declared in configuration."}</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <ForgeDashboardTab
                  bot={bot}
                  systemStatus={systemStatus}
                  onRefresh={handleRefresh}
                  onTabChange={handleTabChange}
                />
              )}

              {activeTab === "console" && <ForgeConsoleTab bot={bot} />}

              {activeTab === "settings" && (
                <ForgeSettingsTab
                  bot={bot}
                  systemStatus={systemStatus}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === "activity" && <ForgeActivityTab bot={bot} />}

              {activeTab === "files" && <ForgeFilesTab bot={bot} />}

              {activeTab === "databases" && <ForgeDatabasesTab bot={bot} />}

              {activeTab === "backups" && <ForgeBackupsTab bot={bot} />}

              {activeTab === "auto-backups" && <ForgeAutoBackupsTab bot={bot} />}

              {activeTab === "network" && (
                <ForgeNetworkTab bot={bot} systemStatus={systemStatus} />
              )}

              {activeTab === "github" && (
                <ForgeGitHubTab bot={bot} onRefresh={handleRefresh} />
              )}

              {activeTab === "schedules" && <ForgeSchedulesTab bot={bot} />}

              {activeTab === "users" && <ForgeUsersTab bot={bot} />}

              {activeTab === "env" && <EnvManagerTab key={bot.id} botId={bot.id} botName={bot.name} botStatus={bot.status} onRestartRequest={handleRefresh}/> }
              {activeTab === "startup" && (
                <ForgeStartupTab bot={bot} onRefresh={handleRefresh} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function BotDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-inset items-center justify-center text-slate-400 font-mono text-xs">
          Loading server...
        </div>
      }
    >
      <BotDetailsContent key={resolvedParams.id} botId={resolvedParams.id} />
    </Suspense>
  );
}
