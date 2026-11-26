'use client';

import React from 'react';
import { BotData, SystemStatus } from '@/lib/types';

interface ForgeNetworkTabProps {
  bot: BotData;
  systemStatus: SystemStatus | null;
}

export function ForgeNetworkTab({ bot, systemStatus }: ForgeNetworkTabProps) {
  const serverIp = systemStatus?.serverIp || '193.70.34.101';
  const serverPort = bot.id === 'bot-1' ? '20039' : '20040';

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Allocations Card */}
      <div className="forge-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">Allocations</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-line text-slate-500">
                <th className="pb-3 font-semibold">IP address</th>
                <th className="pb-3 font-semibold">Port</th>
                <th className="pb-3 font-semibold">Notes</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="hover:bg-raised transition-colors">
                <td className="py-3.5 text-white font-medium">{serverIp}</td>
                <td className="py-3.5 text-slate-300">{serverPort}</td>
                <td className="py-3.5 text-slate-400">Dashboard and webhook</td>
                <td className="py-3.5 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-gold/15 text-gold border border-gold/30 font-bold">
                    Primary
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Inbound & Outbound Sparkline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inbound */}
        <div className="forge-card p-5 space-y-3">
          <span className="text-xs text-slate-400 font-medium">Inbound</span>
          <div className="text-xl font-bold font-mono text-white">
            1.04 GiB
          </div>
          <div className="pt-2 h-24 w-full">
            <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
              <path
                d="M0,60 Q50,65 100,55 T180,45 T240,65 T300,40"
                fill="none"
                stroke="#edb825"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Outbound */}
        <div className="forge-card p-5 space-y-3">
          <span className="text-xs text-slate-400 font-medium">Outbound</span>
          <div className="text-xl font-bold font-mono text-white">
            183.5 MiB
          </div>
          <div className="pt-2 h-24 w-full">
            <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
              <path
                d="M0,45 Q70,47 140,46 T220,44 T300,45"
                fill="none"
                stroke="#edb825"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
