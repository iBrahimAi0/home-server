'use client';

import React, { useState } from 'react';
import { BotData } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface ForgeUsersTabProps {
  bot: BotData;
}

export function ForgeUsersTab({ bot }: ForgeUsersTabProps) {
  const toast = useToast();
  const [users, setUsers] = useState([
    {
      email: '[you@email.com]',
      access: 'Owner',
      isOwner: true,
      twoFactor: 'Enabled',
    },
    {
      email: '[friend@email.com]',
      access: 'Console, Files',
      isOwner: false,
      twoFactor: 'Off',
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [permConsole, setPermConsole] = useState(true);
  const [permFiles, setPermFiles] = useState(true);
  const [permBackups, setPermBackups] = useState(false);
  const [permGithub, setPermGithub] = useState(false);
  const [permStartup, setPermStartup] = useState(false);
  const [permSchedules, setPermSchedules] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setUsers((prev) => [
      ...prev,
      {
        email: inviteEmail.trim(),
        access: 'Console, Files',
        isOwner: false,
        twoFactor: 'Off',
      },
    ]);
    toast.success(`Invite dispatched to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Users List Card */}
      <div className="forge-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Users</h3>
          <button
            onClick={() => {
              const el = document.getElementById('input-invite-email');
              el?.focus();
            }}
            className="forge-btn-primary text-xs py-1.5 px-3.5"
          >
            <span>Invite user</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2027] text-slate-500">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Access</th>
                <th className="pb-3 font-semibold">Two-factor</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1E24]">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-[#181A20] transition-colors">
                  <td className="py-3.5 text-white font-medium">{u.email}</td>
                  <td className="py-3.5">
                    {u.isOwner ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30">
                        Owner
                      </span>
                    ) : (
                      <span className="text-slate-300">{u.access}</span>
                    )}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.twoFactor === 'Enabled'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      {u.twoFactor}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {!u.isOwner && (
                      <button
                        onClick={() => toast.info(`Editing permissions for ${u.email}`)}
                        className="text-[#F5A623] hover:underline font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Invite User Card */}
      <div className="forge-card p-5 space-y-4 font-sans">
        <h3 className="text-sm font-bold text-white tracking-tight">Invite user</h3>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Email</label>
            <input
              id="input-invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="operator@company.com"
              className="w-full bg-[#0D0E12] text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permConsole}
                  onChange={(e) => setPermConsole(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0D0E12] border-[#22242B] accent-[#F5A623]"
                />
                <span>Console</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permFiles}
                  onChange={(e) => setPermFiles(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0D0E12] border-[#22242B] accent-[#F5A623]"
                />
                <span>Files</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permBackups}
                  onChange={(e) => setPermBackups(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0D0E12] border-[#22242B] accent-[#F5A623]"
                />
                <span>Backups</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permGithub}
                  onChange={(e) => setPermGithub(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0D0E12] border-[#22242B] accent-[#F5A623]"
                />
                <span>GitHub Deploy</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permStartup}
                  onChange={(e) => setPermStartup(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0D0E12] border-[#22242B] accent-[#F5A623]"
                />
                <span>Startup</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permSchedules}
                  onChange={(e) => setPermSchedules(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0D0E12] border-[#22242B] accent-[#F5A623]"
                />
                <span>Schedules</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="forge-btn-primary text-xs py-2 px-5"
          >
            <span>Send invite</span>
          </button>
        </form>
      </div>
    </div>
  );
}
