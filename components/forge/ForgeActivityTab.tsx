'use client';

import React, { useState } from 'react';
import { BotData } from '@/lib/types';

interface ForgeActivityTabProps {
  bot: BotData;
}

export function ForgeActivityTab({ bot }: ForgeActivityTabProps) {
  const [filter, setFilter] = useState('all');

  const activities = [
    {
      event: 'server:power.restart',
      user: '[you@email.com]',
      when: '2 minutes ago',
    },
    {
      event: 'github:deploy.success',
      user: 'GitHub',
      when: '2 minutes ago',
    },
    {
      event: 'file.write · commands/color.js',
      user: '[you@email.com]',
      when: 'Yesterday',
    },
    {
      event: 'backup.create',
      user: '[you@email.com]',
      when: '4 months ago',
    },
    {
      event: 'server:console.command',
      user: '[you@email.com]',
      when: '4 months ago',
    },
    {
      event: 'database:query.execute',
      user: '[you@email.com]',
      when: '4 months ago',
    },
  ];

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.event.startsWith(filter));

  return (
    <div className="space-y-4">
      {/* Activity Card */}
      <div className="forge-card p-5 space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Recent activity</h3>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-inset text-slate-300 text-xs font-mono px-3 py-1.5 rounded-lg border border-line focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="all">All events</option>
            <option value="server">Power events</option>
            <option value="github">GitHub deploys</option>
            <option value="file">File changes</option>
            <option value="backup">Backups</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-slate-500 font-mono">
                <th className="pb-3 font-semibold">Event</th>
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono">
              {filtered.map((act, i) => (
                <tr key={i} className="hover:bg-raised transition-colors">
                  <td className="py-3 text-slate-200">{act.event}</td>
                  <td className="py-3 text-slate-400">{act.user}</td>
                  <td className="py-3 text-slate-500 text-right">{act.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
