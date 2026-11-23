'use client';

import React, { useState } from 'react';
import { BotData } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface ForgeSchedulesTabProps {
  bot: BotData;
}

export function ForgeSchedulesTab({ bot }: ForgeSchedulesTabProps) {
  const toast = useToast();
  const [schedules, setSchedules] = useState([
    {
      name: 'Nightly restart',
      cron: '0 4 * * *',
      lastRun: '—',
      nextRun: '—',
      status: 'Active',
    },
    {
      name: 'Daily backup',
      cron: '0 3 * * *',
      lastRun: '—',
      nextRun: '—',
      status: 'Active',
    },
    {
      name: 'Weekly cleanup',
      cron: '0 5 * * 0',
      lastRun: '—',
      nextRun: '—',
      status: 'Paused',
    },
  ]);

  const [newName, setNewName] = useState('');
  const [newCron, setNewCron] = useState('0 4 * * *');

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSchedules((prev) => [
      ...prev,
      {
        name: newName.trim(),
        cron: newCron.trim() || '0 0 * * *',
        lastRun: '—',
        nextRun: 'Tomorrow',
        status: 'Active',
      },
    ]);
    setNewName('');
    toast.success(`Schedule "${newName}" created successfully`);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Schedules List Card */}
      <div className="forge-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Schedules</h3>
          <button
            onClick={() => {
              const el = document.getElementById('input-schedule-name');
              el?.focus();
            }}
            className="forge-btn-primary text-xs py-1.5 px-3.5"
          >
            <span>New schedule</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2027] text-slate-500">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Cron</th>
                <th className="pb-3 font-semibold">Last run</th>
                <th className="pb-3 font-semibold">Next run</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1E24]">
              {schedules.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#181A20] transition-colors">
                  <td className="py-3.5 text-white font-medium">{s.name}</td>
                  <td className="py-3.5 text-slate-300">{s.cron}</td>
                  <td className="py-3.5 text-slate-500">{s.lastRun}</td>
                  <td className="py-3.5 text-slate-500">{s.nextRun}</td>
                  <td className="py-3.5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        s.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. New Schedule Form & Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New Schedule */}
        <div className="forge-card p-5 space-y-4 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">New schedule</h3>

          <form onSubmit={handleCreateSchedule} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Name</label>
              <input
                id="input-schedule-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nightly automated reboot"
                className="w-full bg-[#0D0E12] text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Cron expression</label>
              <input
                type="text"
                value={newCron}
                onChange={(e) => setNewCron(e.target.value)}
                placeholder="0 4 * * *"
                className="w-full bg-[#0D0E12] text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623]"
              />
            </div>

            <button
              type="submit"
              className="forge-btn-primary text-xs py-2 px-5"
            >
              <span>Create schedule</span>
            </button>
          </form>
        </div>

        {/* Tasks Card */}
        <div className="forge-card p-5 space-y-4 font-sans">
          <h3 className="text-sm font-bold text-white tracking-tight">Tasks</h3>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#0D0E12] border border-[#1E2027] flex items-center justify-between">
              <span className="text-slate-300">Send command</span>
              <span className="px-2 py-0.5 rounded bg-[#181A20] text-slate-400">Console</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0D0E12] border border-[#1E2027] flex items-center justify-between">
              <span className="text-slate-300">Power action</span>
              <span className="px-2 py-0.5 rounded bg-[#181A20] text-slate-400">Restart</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0D0E12] border border-[#1E2027] flex items-center justify-between">
              <span className="text-slate-300">Create backup</span>
              <span className="px-2 py-0.5 rounded bg-[#181A20] text-slate-400">Backups</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0D0E12] border border-[#1E2027] flex items-center justify-between">
              <span className="text-slate-300">Deploy from GitHub</span>
              <span className="px-2 py-0.5 rounded bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/25 font-bold">New</span>
            </div>
          </div>

          <button
            onClick={() => toast.info('Configure new schedule action task')}
            className="forge-btn-dark text-xs py-1.5 px-3.5"
          >
            <span>Add task</span>
          </button>
        </div>
      </div>
    </div>
  );
}
