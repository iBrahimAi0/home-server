'use client';

import React, { useState, useEffect } from 'react';
import { BotData } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { Shield, UserPlus, Trash2, Edit2, Check, X, ShieldAlert, Key } from 'lucide-react';

interface SubUser {
  id: string;
  email: string;
  permissions: string[];
  isOwner: boolean;
  twoFactor: string;
  addedAt: string;
}

interface ForgeUsersTabProps {
  bot: BotData;
}

export function ForgeUsersTab({ bot }: ForgeUsersTabProps) {
  const toast = useToast();
  const [users, setUsers] = useState<SubUser[]>([
    {
      id: 'usr-1',
      email: 'owner@server.local',
      permissions: ['All Permissions (Full Host Access)'],
      isOwner: true,
      twoFactor: 'Enabled',
      addedAt: '2026-03-01',
    },
    {
      id: 'usr-2',
      email: 'operator@discord.org',
      permissions: ['Console', 'Files', 'Startup'],
      isOwner: false,
      twoFactor: 'Off',
      addedAt: '2026-11-20',
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [permConsole, setPermConsole] = useState(true);
  const [permFiles, setPermFiles] = useState(true);
  const [permDatabases, setPermDatabases] = useState(false);
  const [permBackups, setPermBackups] = useState(false);
  const [permGithub, setPermGithub] = useState(false);
  const [permStartup, setPermStartup] = useState(false);
  const [permSchedules, setPermSchedules] = useState(false);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<SubUser | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`forge_users_${bot.id}`);
      if (saved) {
        try {
          setUsers(JSON.parse(saved));
        } catch {}
      }
    }
  }, [bot.id]);

  const saveUsersState = (updated: SubUser[]) => {
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`forge_users_${bot.id}`, JSON.stringify(updated));
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const selectedPerms: string[] = [];
    if (permConsole) selectedPerms.push('Console');
    if (permFiles) selectedPerms.push('Files');
    if (permDatabases) selectedPerms.push('Databases');
    if (permBackups) selectedPerms.push('Backups');
    if (permGithub) selectedPerms.push('GitHub');
    if (permStartup) selectedPerms.push('Startup');
    if (permSchedules) selectedPerms.push('Schedules');

    const newUser: SubUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 7),
      email: inviteEmail.trim(),
      permissions: selectedPerms.length > 0 ? selectedPerms : ['Read-only'],
      isOwner: false,
      twoFactor: 'Off',
      addedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [...users, newUser];
    saveUsersState(updated);
    toast.success(`User "${inviteEmail}" invited with ${newUser.permissions.join(', ')} access.`);
    setInviteEmail('');
  };

  const handleDeleteUser = (id: string, email: string) => {
    const updated = users.filter((u) => u.id !== id);
    saveUsersState(updated);
    toast.info(`Removed user ${email}`);
  };

  const handleSaveEditedPermissions = (userId: string, newPerms: string[]) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, permissions: newPerms.length > 0 ? newPerms : ['Read-only'] } : u
    );
    saveUsersState(updated);
    toast.success('Permissions updated successfully.');
    setEditingUser(null);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Informative Security Banner */}
      <div className="forge-card p-4 flex items-start gap-3 text-xs font-mono text-slate-300">
        <Shield className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Role-Based Access Control (RBAC): </span>
          <span>
            The Owner account has root authority over server configuration and power states. Sub-users only receive access to the specific modules you check below (e.g. Console stream, File Manager, SQLite Databases, or Startup Environment).
          </span>
        </div>
      </div>

      {/* 1. Users List Card */}
      <div className="forge-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Active Sub-Users & Permissions</h3>
            <p className="text-xs text-slate-400 font-mono">
              Manage operators who can view or control container #{bot.id}
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('input-invite-email');
              el?.focus();
            }}
            className="forge-btn-primary text-xs py-1.5 px-3.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite User</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-line text-slate-500 uppercase text-[10px]">
                <th className="pb-3 font-semibold">User / Email</th>
                <th className="pb-3 font-semibold">Authorized Modules</th>
                <th className="pb-3 font-semibold">2FA Security</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-raised/80 transition-colors">
                  <td className="py-3.5 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-raised border border-line flex items-center justify-center text-[10px] text-gold font-bold">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    {u.isOwner ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gold/15 text-gold border border-gold/30">
                        Owner (Full Access)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.permissions.map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] text-slate-300 border border-white/[0.06]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.twoFactor === 'Enabled'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      {u.twoFactor}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {!u.isOwner ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1 rounded text-slate-400 hover:text-gold hover:bg-white/[0.04] transition-colors cursor-pointer"
                          title="Edit Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Root Administrator</span>
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
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Invite Sub-User</h3>
          <p className="text-xs text-slate-400 font-mono">
            Grant permission-scoped operator credentials to a team member
          </p>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">User Email Address</label>
            <input
              id="input-invite-email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="operator@company.com"
              className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Assign Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permConsole}
                  onChange={(e) => setPermConsole(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Console</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permFiles}
                  onChange={(e) => setPermFiles(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Files</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permDatabases}
                  onChange={(e) => setPermDatabases(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Databases</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permBackups}
                  onChange={(e) => setPermBackups(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Backups</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permGithub}
                  onChange={(e) => setPermGithub(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>GitHub</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permStartup}
                  onChange={(e) => setPermStartup(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Startup</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-inset/80 border border-line hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={permSchedules}
                  onChange={(e) => setPermSchedules(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Schedules</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="forge-btn-primary text-xs py-2 px-5 font-bold cursor-pointer"
          >
            <span>Dispatch Invitation</span>
          </button>
        </form>
      </div>

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="forge-card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-white text-sm">Edit Permissions</h3>
                <p className="text-xs text-slate-400 font-mono">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Select Allowed Modules</label>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                {['Console', 'Files', 'Databases', 'Backups', 'GitHub', 'Startup', 'Schedules'].map((m) => {
                  const isChecked = editingUser.permissions.includes(m);
                  return (
                    <label key={m} className="flex items-center gap-2 p-2 rounded bg-inset border border-line cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingUser({
                              ...editingUser,
                              permissions: [...editingUser.permissions.filter(p => p !== 'Read-only'), m],
                            });
                          } else {
                            const filtered = editingUser.permissions.filter((p) => p !== m);
                            setEditingUser({
                              ...editingUser,
                              permissions: filtered.length > 0 ? filtered : ['Read-only'],
                            });
                          }
                        }}
                        className="w-4 h-4 rounded bg-inset border-line accent-gold"
                      />
                      <span>{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="forge-btn-dark text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEditedPermissions(editingUser.id, editingUser.permissions)}
                className="forge-btn-primary text-xs py-1.5 px-4 font-bold"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
