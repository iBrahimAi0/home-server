'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Play, 
  RotateCw, 
  Square, 
  Menu, 
  X, 
  ChevronDown,
  Loader2,
  LogOut,
  Layers
} from 'lucide-react';
import { NexusLogo } from '@/components/NexusLogo';
import { api } from '@/lib/api';
import { BotData, SystemStatus } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface SidebarProps {
  currentBotId?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  bots?: BotData[];
  onRefresh?: () => void;
}

export function Sidebar({ currentBotId, activeTab, onTabChange, bots: propBots, onRefresh }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [botsList, setBotsList] = useState<BotData[]>(propBots || []);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [powerLoading, setPowerLoading] = useState<'start' | 'stop' | 'restart' | null>(null);

  useEffect(() => {
    if (propBots && propBots.length > 0) {
      setBotsList(propBots);
    } else {
      api.getBots().then(setBotsList).catch(() => {});
    }
    api.getSystemStatus().then(setSystemStatus).catch(() => {});
  }, [propBots]);

  // Determine current active bot
  const selectedBotId = currentBotId || (botsList.length > 0 ? botsList[0].id : 'bot-1');
  const currentBot = botsList.find(b => b.id === selectedBotId) || botsList[0];

  // Resolve current active tab
  const currentTab = activeTab || 'overview';

  // Navigation sections from Forge design
  const navGroups = [
    {
      category: 'GENERAL',
      items: [
        { id: 'overview', name: 'Dashboard' },
        { id: 'servers', name: 'Servers' },
        { id: 'console', name: 'Console' },
        { id: 'settings', name: 'Settings' },
        { id: 'activity', name: 'Activity' },
      ],
    },
    {
      category: 'MANAGEMENT',
      items: [
        { id: 'files', name: 'Files' },
        { id: 'databases', name: 'Databases' },
        { id: 'backups', name: 'Backups' },
        { id: 'auto-backups', name: 'Automatic backups' },
        { id: 'network', name: 'Network' },
        { id: 'github', name: 'GitHub Deploy' },
      ],
    },
    {
      category: 'CONFIGURATION',
      items: [
        { id: 'schedules', name: 'Schedules' },
        { id: 'users', name: 'Users' },
        { id: 'startup', name: 'Startup' },
      ],
    },
  ];

  const handleNavClick = (tabId: string) => {
    setMobileOpen(false);
    if (tabId === 'servers') {
      router.push('/bots');
      return;
    }
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      router.push(`/bots/${selectedBotId}?tab=${tabId}`);
    }
  };

  const handlePowerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!currentBot || powerLoading) return;
    setPowerLoading(action);
    try {
      if (action === 'start') {
        await api.startBot(currentBot.id);
        toast.success(`Server ${currentBot.name} started`);
      } else if (action === 'stop') {
        await api.stopBot(currentBot.id);
        toast.info(`Server ${currentBot.name} stopped`);
      } else {
        await api.restartBot(currentBot.id);
        toast.success(`Server ${currentBot.name} restarted`);
      }
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast.error(msg);
    } finally {
      setPowerLoading(null);
    }
  };

  const serverIp = systemStatus?.serverIp || '193.70.34.101';
  const serverPort = currentBot?.id === 'bot-1' ? '20039' : '20040';

  return (
    <>
      {/* Mobile Toggle */}
      <button
        id="btn-mobile-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
        className="fixed top-3 left-4 z-50 p-2 rounded-lg bg-[#14161B] border border-[#22242B] text-slate-300 md:hidden"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between w-64 bg-[#0D0E12] border-r border-[#1C1E24] select-none transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Forge Brand Logo */}
          <div className="px-5 py-4 border-b border-[#1C1E24]">
            <Link href="/" className="inline-block">
              <NexusLogo size={26} showText={true} />
            </Link>
          </div>

          {/* Current Bot / Server Header Card */}
          <div className="px-5 py-3 border-b border-[#1C1E24]">
            <div className="relative group">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[14px] truncate tracking-tight">
                  {currentBot ? currentBot.name : 'Role Manager'}
                </span>
                {botsList.length > 1 && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {serverIp}:{serverPort}
              </div>

              {/* Bot Selector Dropdown if multiple bots */}
              {botsList.length > 1 && (
                <select
                  aria-label="Switch active bot"
                  value={selectedBotId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    router.push(`/bots/${nextId}?tab=${currentTab}`);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {botsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick 3 Power Buttons */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#14161B] border border-[#22242B]">
              <button
                id="btn-sidebar-power-start"
                onClick={() => handlePowerAction('start')}
                disabled={currentBot?.status === 'online' || powerLoading !== null}
                title="Start Server"
                className="flex items-center justify-center py-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-[#1A1C23] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {powerLoading === 'start' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>

              <button
                id="btn-sidebar-power-restart"
                onClick={() => handlePowerAction('restart')}
                disabled={powerLoading !== null}
                title="Restart Server"
                className="flex items-center justify-center py-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-[#1A1C23] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {powerLoading === 'restart' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <RotateCw className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                id="btn-sidebar-power-stop"
                onClick={() => handlePowerAction('stop')}
                disabled={currentBot?.status !== 'online' || powerLoading !== null}
                title="Stop Server"
                className="flex items-center justify-center py-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-[#1A1C23] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {powerLoading === 'stop' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Categories */}
          <div className="py-3 px-3 space-y-4">
            {navGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="px-2 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
                  {group.category}
                </div>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-item-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-[#FACC15]/10 text-[#FACC15] font-semibold border-l-2 border-[#FACC15]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#14161B]'
                        }`}
                      >
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom User Account Pill with Sign In / Out */}
        <div className="p-3 border-t border-[#1C1E24]">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#14161B]/80 hover:bg-[#14161B] transition-colors border border-white/[0.05]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FACC15] text-black font-bold text-xs shrink-0 shadow-sm">
                O
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">Owner</p>
                <p className="text-[10px] text-emerald-400 font-mono truncate">&bull; Authenticated</p>
              </div>
            </div>
            <button
              id="btn-sidebar-logout"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('forge_session');
                }
                router.push('/login');
              }}
              title="Sign Out"
              className="p-1.5 rounded text-slate-400 hover:text-[#FACC15] hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
