'use client';

import React from 'react';
import { Server, Cpu, HardDrive, Database, Shield, CheckCircle2 } from 'lucide-react';
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
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}

export function SystemStatus({ status }: SystemStatusProps) {
  if (!status) {
    return (
      <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-6 h-64 flex items-center justify-center">
        <div className="text-slate-400 text-xs font-mono">Gathering host telemetry...</div>
      </div>
    );
  }

  return (
    <div
      id="system-hardware-status"
      className="rounded-lg bg-[#121722] border border-[#1E273A] p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E273A]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Ubuntu Server Host Telemetry</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Host: <span className="text-slate-200">{status.hostname}</span> &bull; Local IP: <span className="text-slate-200">{status.serverIp}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Host Operational</span>
          </span>
        </div>
      </div>

      {/* Hardware Specifications Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Processor */}
        <div className="rounded-md bg-[#0C1018] border border-[#1A2232] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Processor</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-white truncate font-mono" title={status.cpu.model}>
            {status.cpu.model}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{status.cpu.cores} Cores</span>
            <span className="text-indigo-400 font-semibold">{status.cpu.usagePercentage}% load</span>
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-md bg-[#0C1018] border border-[#1A2232] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Memory (RAM)</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-white font-mono">
            {status.ram.usedGB} GB / {status.ram.totalGB} GB
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Free: {status.ram.freeGB} GB</span>
            <span className="text-sky-400 font-semibold">{status.ram.usagePercentage}% used</span>
          </div>
        </div>

        {/* Storage */}
        <div className="rounded-md bg-[#0C1018] border border-[#1A2232] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Storage (SSD)</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-white font-mono">
            {status.storage.usedGB} GB / {status.storage.totalGB} GB
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Free: {status.storage.freeGB} GB</span>
            <span className="text-emerald-400 font-semibold">{status.storage.usedPercentage}% used</span>
          </div>
        </div>

        {/* Runtime & Uptime */}
        <div className="rounded-md bg-[#0C1018] border border-[#1A2232] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>OS & Node.js</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-white truncate font-mono">
            Ubuntu ({status.arch})
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Node {status.nodeVersion}</span>
            <span className="text-amber-400">{formatUptime(status.uptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
