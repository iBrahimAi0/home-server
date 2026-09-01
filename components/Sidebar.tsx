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
  Server, 
  Activity,
  Menu,
  X,
  Radio
} from 'lucide-react';

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
      name: 'Bots',
      href: '/bots',
      icon: Bot,
      badge: 'Manage',
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
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#111726] border border-[#1E293B] text-slate-300 hover:text-white md:hidden shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-[#0C111D] border-r border-[#1B2438] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="flex items-center justify-between p-4 border-b border-[#1B2438]">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-purple-500/20">
                <Server className="w-5 h-5" />
              </div>

              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-white text-sm tracking-tight truncate">
                    Home Server
                  </span>
                  <span className="text-[11px] font-medium text-purple-400 truncate">
                    Bot Controller
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              id="btn-sidebar-collapse-toggle"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
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
                  id={`nav-link-${item.name.toLowerCase()}`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white border border-purple-500/30 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E] border border-transparent'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      active ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                            active
                              ? 'bg-purple-500/30 text-purple-300'
                              : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active highlight indicator bar */}
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-purple-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Server Status Card */}
        <div className="p-3 border-t border-[#1B2438]">
          <div
            className={`rounded-xl bg-[#111726]/90 border border-[#1E293B] p-3 shadow-sm ${
              collapsed ? 'flex flex-col items-center justify-center p-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Server Status
                  </span>
                  <span className="text-xs font-bold text-slate-200 mt-0.5">
                    Ubuntu Server
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                {!collapsed && (
                  <span className="text-xs font-bold text-emerald-400">Online</span>
                )}
              </div>
            </div>

            {!collapsed && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-purple-400" />
                  <span>Port 3000</span>
                </span>
                <span className="font-mono text-slate-400">i5-3rd Gen</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
