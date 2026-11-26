'use client';

import React, { useState } from 'react';
import { BotData } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface ForgeAutoBackupsTabProps {
  bot: BotData;
}

export function ForgeAutoBackupsTab({ bot }: ForgeAutoBackupsTabProps) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState('Daily');
  const [timeUtc, setTimeUtc] = useState('04:00');
  const [keepLatest, setKeepLatest] = useState(1);

  const [ruleDeploy, setRuleDeploy] = useState(true);
  const [ruleLock, setRuleLock] = useState(false);
  const [ruleDeleteOldest, setRuleDeleteOldest] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Automatic backup schedule saved successfully');
  };

  return (
    <div className="space-y-4 font-sans">
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Schedule Card */}
        <div className="forge-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight">Schedule</h3>

          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-inset border-line accent-gold"
              />
              <span>Enable automatic backups</span>
            </label>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-400 font-medium">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Time (UTC)</label>
              <input
                type="text"
                value={timeUtc}
                onChange={(e) => setTimeUtc(e.target.value)}
                className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Keep the latest</label>
              <input
                type="number"
                min={1}
                max={10}
                value={keepLatest}
                onChange={(e) => setKeepLatest(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        {/* Rules Card */}
        <div className="forge-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-white tracking-tight">Rules</h3>

            <div className="space-y-3 pt-1 text-xs text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleDeploy}
                  onChange={(e) => setRuleDeploy(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Back up before every GitHub deploy</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleLock}
                  onChange={(e) => setRuleLock(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Lock the newest backup</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleDeleteOldest}
                  onChange={(e) => setRuleDeleteOldest(e.target.checked)}
                  className="w-4 h-4 rounded bg-inset border-line accent-gold"
                />
                <span>Delete the oldest when the limit is reached</span>
              </label>

              <div className="pt-2 text-slate-500 font-mono text-[11px]">
                Next run: Tomorrow at {timeUtc} UTC
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="forge-btn-primary text-xs py-2 px-5 self-start"
          >
            <span>Save schedule</span>
          </button>
        </div>
      </form>
    </div>
  );
}
