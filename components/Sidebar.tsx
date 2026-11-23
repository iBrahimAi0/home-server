'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bot, 
  Terminal, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Server
} from 'lucide-react';
import { BRANDING } from '@/lib/branding';
import { NexusLogo } from '@/components/NexusLogo';

interface SidebarProps {
  serverStatus?: 'online' | 'offline' | 'degraded';
  serverUptime?: number;
}

export function Sidebar({ serverStatus = 'online', serverUptime }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Bots Fleet',
      href: '/bots',
      icon: Bot,
      badge: null,
    },
    {
      name: 'Console',
      href: '/console',
      icon: Terminal,
      badge: 'Live',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        id="btn-mobile-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
        className="fixed top-3.5 left-4 z-50 p-2 rounded-xl bg-[#0F1422] border border-white/[0.08] text-slate-300 hover:text-white md:hidden shadow-xl"
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
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-[#0B0F17]/95 backdrop-blur-2xl border-r border-white/[0.06] transition-all duration-200 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="flex items-center justify-between px-4.5 py-4 border-b border-white/[0.06]">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <NexusLogo size={34} />

              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-extrabold text-white text-[15px] tracking-tight truncate">
                      Nexus<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Panel</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-bold">
                      PRO
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-1 truncate">
                    Ubuntu Bot Controller
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              id="btn-sidebar-collapse-toggle"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white font-semibold border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            active
                              ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                              : 'bg-white/[0.05] text-slate-400 group-hover:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Clean active indicator pill */}
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Server Node Telemetry Card */}
        <div className="p-3 border-t border-white/[0.06]">
          <div
            className={`rounded-xl bg-[#090C12]/80 border border-white/[0.05] p-3 shadow-inner ${
              collapsed ? 'flex flex-col items-center justify-center' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    Ubuntu Server
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {!collapsed && (
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">Online</span>
                )}
              </div>
            </div>

            {!collapsed && (
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate">{BRANDING.version}</span>
                <span className="text-slate-400 truncate">Node 22 LTS</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
