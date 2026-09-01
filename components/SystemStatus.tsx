'use client';

import React from 'react';
import { Server, Cpu, HardDrive, Database, Network, Terminal, CheckCircle2, Shield } from 'lucide-react';
import { SystemStatus as SystemStatusType } from '@/lib/types';

interface SystemStatusProps {
  status: SystemStatusType | null;
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hrs`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} mins`);
  return parts.join(', ');
}

export function SystemStatus({ status }: SystemStatusProps) {
  if (!status) {
    return (
      <div className="animate-pulse rounded-xl bg-[#111726]/80 border border-[#1E293B] p-6 h-64 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Gathering server hardware telemetry...</div>
      </div>
    );
  }

  return (
    <div
      id="system-hardware-status"
      className="rounded-xl bg-[#111726]/90 border border-[#1E293B] p-6 shadow-lg shadow-black/20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Ubuntu Home Server Node</h3>
            <p className="text-xs text-slate-400">
              Host: <span className="text-slate-200 font-mono">{status.hostname}</span> &bull; IP: <span className="text-slate-200 font-mono">{status.serverIp}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All Systems Operational</span>
          </span>
        </div>
      </div>

      {/* Hardware Specifications Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Processor */}
        <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Processor</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white truncate" title={status.cpu.model}>
            {status.cpu.model}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{status.cpu.cores} Cores @ {status.cpu.speedMHz}MHz</span>
            <span className="text-purple-400 font-semibold">{status.cpu.usagePercentage}% load</span>
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <span>Memory (RAM)</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white font-mono">
            {status.ram.usedGB} GB / {status.ram.totalGB} GB
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Free: {status.ram.freeGB} GB</span>
            <span className="text-sky-400 font-semibold">{status.ram.usagePercentage}% used</span>
          </div>
        </div>

        {/* Storage */}
        <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Storage (SSD)</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white font-mono">
            {status.storage.usedGB} GB / {status.storage.totalGB} GB
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Available: {status.storage.freeGB} GB</span>
            <span className="text-emerald-400 font-semibold">{status.storage.usedPercentage}% used</span>
          </div>
        </div>

        {/* Runtime & Uptime */}
        <div className="rounded-lg bg-[#0A0E17]/60 border border-[#1E293B]/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>OS & Node.js</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white truncate">
            Ubuntu Server ({status.arch})
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Node {status.nodeVersion}</span>
            <span className="text-amber-400 truncate">{formatUptime(status.uptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
